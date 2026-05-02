/**
 * App factory — builds the Hono app graph.
 *
 * Kept separate from server.ts so tests can stand up the full handler
 * tree against in-memory transports without binding a port.
 */
import { Hono }    from "hono";
import { cors }    from "hono/cors";
import { healthz } from "./routes/healthz.js";
import { manifest } from "./routes/manifest.js";
import { mcp }     from "./routes/mcp.js";
import { mcpSvm }  from "./routes/mcp-svm.js";
import { oauthMetadata } from "./routes/oauth-metadata.js";
import { createClients }     from "./chain/clients.js";
import { TtlCache }          from "./chain/cache.js";
import { createFacilitator } from "./x402/facilitator.js";
import { createSvmFacilitator } from "./svm/facilitator.js";
import { usdcMintFor, defaultRpcUrlFor } from "./svm/cluster.js";
import { createVerifier, bearerMiddleware } from "./oauth.js";

import type { Config } from "./config.js";
import type { Logger } from "./log.js";
import type { ModelRecord } from "./chain/registry.js";
import type { Quote }       from "./chain/agency.js";
import type { X402Network } from "./x402/types.js";
import type { ModelManifest } from "./runtime.js";

export interface AppDeps {
  config: Config;
  log:    Logger;
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

  const clients     = createClients(deps.config);
  const facilitator = createFacilitator({
    baseUrl: deps.config.X402_FACILITATOR_URL,
    apiKey:  deps.config.X402_FACILITATOR_API_KEY,
  });

  const recordCache   = new TtlCache<string, ModelRecord>(30_000);
  const quoteCache    = new TtlCache<string, Quote>(2_000);
  const manifestCache = new TtlCache<string, ModelManifest>(5 * 60_000);

  const network: X402Network =
    deps.config.CHAIN === "baseSepolia" ? "base-sepolia" : "base";

  // OAuth — null when OAUTH_ENABLED=false, in which case the bearer
  // middleware is a pass-through.
  const verifier = createVerifier(deps.config, deps.log);
  const resourceMetadataPath = "/.well-known/oauth-protected-resource";

  // Liveness + ready probes
  app.route("/healthz", healthz(deps));

  // OAuth resource metadata (RFC 9728). Always mounted so MCP
  // inspectors can validate the well-known path even when OAuth
  // is disabled in dev.
  app.use(resourceMetadataPath, cors({ origin: "*" }));
  app.route(resourceMetadataPath, oauthMetadata(deps));

  // CORS — locked down for paid endpoints; permissive for discovery.
  app.use("/.well-known/*", cors({ origin: "*" }));
  app.use("/m/:agency/manifest.json", cors({ origin: "*" }));
  app.use("/m/:agency/mcp", cors({
    origin: "*",
    allowHeaders: [
      "content-type",
      "authorization",
      "PAYMENT-SIGNATURE",
      "X-Wallet-Address",
      "x-modula-agent",
    ],
    exposeHeaders: ["PAYMENT-RESPONSE", "WWW-Authenticate"],
    maxAge: 600,
  }));

  // Per-model manifest read
  app.route("/m/:agency/manifest.json", manifest({
    ...deps,
    clients,
    recordCache,
    manifestCache,
  }));

  // MCP + x402 + OAuth. Bearer mounted before the route so it runs
  // ahead of the JSON-RPC dispatcher; the dispatcher itself opens
  // tools/list to anonymous calls.
  app.use("/m/:agency/mcp", bearerMiddleware(verifier, resourceMetadataPath));
  app.route("/m/:agency/mcp", mcp({
    ...deps,
    clients,
    facilitator,
    recordCache,
    quoteCache,
    manifestCache,
    network,
    modulaTokenAddress: deps.config.MODULA_TOKEN_ADDRESS as `0x${string}` | undefined,
  }));

  // SVM settlement path — only mounted when SVM_ENABLED=true. When the
  // flag is off, requests to /m/:agency/mcp/svm fall through to the
  // notFound handler and return 404, which is the right signal: the
  // route does not exist on this gateway.
  if (deps.config.SVM_ENABLED) {
    if (!deps.config.SVM_X402_FACILITATOR_URL) {
      throw new Error(
        "SVM_ENABLED=true but SVM_X402_FACILITATOR_URL is unset",
      );
    }
    const svmNetwork  = deps.config.SVM_NETWORK;
    const svmRpcUrl   = deps.config.SVM_RPC_URL ?? defaultRpcUrlFor(svmNetwork);
    const svmUsdcMint = usdcMintFor(svmNetwork);
    const svmFacilitator = createSvmFacilitator({
      baseUrl: deps.config.SVM_X402_FACILITATOR_URL,
      apiKey:  deps.config.SVM_X402_FACILITATOR_API_KEY,
    });
    deps.log.info(
      { network: svmNetwork, rpc: svmRpcUrl, mint: svmUsdcMint },
      "svm_route_mounted",
    );

    // Same CORS shape as the EVM /mcp endpoint.
    app.use("/m/:agency/mcp/svm", cors({
      origin: "*",
      allowHeaders: [
        "content-type",
        "authorization",
        "PAYMENT-SIGNATURE",
        "X-Wallet-Address",
        "x-modula-agent",
      ],
      exposeHeaders: ["PAYMENT-RESPONSE", "WWW-Authenticate"],
      maxAge: 600,
    }));
    app.use("/m/:agency/mcp/svm", bearerMiddleware(verifier, resourceMetadataPath));
    app.route("/m/:agency/mcp/svm", mcpSvm({
      ...deps,
      clients,
      facilitator:   svmFacilitator,
      recordCache,
      quoteCache,
      manifestCache,
      network:       svmNetwork,
      usdcMint:      svmUsdcMint,
    }));
  }

  // 404 fallback
  app.notFound((c) => c.json({ error: { code: "not_found", message: "no route" } }, 404));

  return app;
}
