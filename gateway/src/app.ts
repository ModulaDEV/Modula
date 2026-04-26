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
import { createClients }     from "./chain/clients.js";
import { TtlCache }          from "./chain/cache.js";
import { createFacilitator } from "./x402/facilitator.js";

import type { Config } from "./config.js";
import type { Logger } from "./log.js";
import type { ModelRecord } from "./chain/registry.js";
import type { Quote }       from "./chain/agency.js";
import type { X402Network } from "./x402/types.js";

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

  const recordCache = new TtlCache<string, ModelRecord>(30_000);
  const quoteCache  = new TtlCache<string, Quote>(2_000);

  const network: X402Network =
    deps.config.CHAIN === "baseSepolia" ? "base-sepolia" : "base";

  // Liveness + ready probes
  app.route("/healthz", healthz(deps));

  // CORS — locked down for paid endpoints; permissive for discovery.
  app.use("/.well-known/*", cors({ origin: "*" }));
  app.use("/m/:agency/manifest.json", cors({ origin: "*" }));
  app.use("/m/:agency/mcp", cors({
    origin: "*",
    allowHeaders: [
      "content-type",
      "authorization",
      "PAYMENT-SIGNATURE",
      "x-modula-agent",
    ],
    exposeHeaders: ["PAYMENT-RESPONSE"],
    maxAge: 600,
  }));

  // Per-model manifest read
  app.route("/m/:agency/manifest.json", manifest(deps));

  // MCP + x402
  app.route("/m/:agency/mcp", mcp({
    ...deps,
    clients,
    facilitator,
    recordCache,
    quoteCache,
    network,
  }));

  // 404 fallback
  app.notFound((c) => c.json({ error: { code: "not_found", message: "no route" } }, 404));

  return app;
}
