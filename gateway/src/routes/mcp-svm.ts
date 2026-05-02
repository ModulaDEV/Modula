/**
 * MCP route, SVM settlement variant: POST /m/:agency/mcp/svm
 *
 * Identical JSON-RPC dispatch surface to the EVM /m/:agency/mcp
 * route — same initialize / tools/list / tools/call methods, same
 * MCP 2025-11-25 protocol version. The only difference is the
 * payment middleware mounted in front: svmMiddleware verifies a
 * signed SPL Token-2022 USDC transfer instead of an EIP-3009
 * authorization.
 *
 * Mounted only when SVM_ENABLED=true. When disabled, requests to
 * this path get a 503 from the parent app's gating handler.
 */
import { Hono } from "hono";
import type { Context } from "hono";
import type { Address } from "viem";

import type { AppDeps }     from "../app.js";
import type { ModelRecord } from "../chain/registry.js";
import type { SvmFacilitatorClient } from "../svm/facilitator.js";
import { svmMiddleware }    from "../svm/middleware.js";
import { logAccess }        from "../chain/access.js";
import { BadRequest }       from "../errors.js";
import type { Clients }     from "../chain/clients.js";
import type { TtlCache }    from "../chain/cache.js";
import type { Quote }       from "../chain/agency.js";
import { fetchManifest, callRuntime, type ModelManifest } from "../runtime.js";

interface McpSvmDeps extends AppDeps {
  clients:        Clients;
  facilitator:    SvmFacilitatorClient;
  recordCache:    TtlCache<string, ModelRecord>;
  quoteCache:     TtlCache<string, Quote>;
  manifestCache:  TtlCache<string, ModelManifest>;
  network:        "solana" | "solana-devnet";
  usdcMint:       string;
}

const PROTOCOL_VERSION = "2025-11-25";

export function mcpSvm(deps: McpSvmDeps): Hono {
  const app = new Hono();

  app.post(
    "/",
    svmMiddleware({
      clients:     deps.clients,
      facilitator: deps.facilitator,
      registry:    deps.config.addresses.registry,
      recordCache: deps.recordCache,
      quoteCache:  deps.quoteCache,
      network:     deps.network,
      usdcMint:    deps.usdcMint,
      log:         deps.log,
    }),
    async (c) => {
      const body = c.get("rpc:body" as never) as {
        jsonrpc?: string;
        id?:      number | string;
        method?:  string;
        params?:  unknown;
      };
      if (!body || body.jsonrpc !== "2.0" || body.method == null) {
        throw new BadRequest("expected JSON-RPC 2.0 request");
      }

      switch (body.method) {
        case "initialize":
          return c.json(rpcResult(body.id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities:    { tools: { listChanged: false } },
            serverInfo:      {
              name:    "modula-gateway-svm",
              version: "0.1.0",
            },
          }));

        case "tools/list":
          return c.json(await handleListTools(deps, c));

        case "tools/call":
          return c.json(await handleCallTool(deps, c, body));

        default:
          return c.json(
            rpcError(body.id, -32601, `Method not found: ${body.method}`),
            200,
          );
      }
    },
  );

  return app;
}

// -------- handlers (identical surface to mcp.ts) --------

async function handleListTools(deps: McpSvmDeps, c: Context) {
  const agency = c.req.param("agency") as Address;
  const record = c.get("x402:record" as never) as ModelRecord | undefined
    ?? await deps.recordCache.getOrLoad(`agency:${agency.toLowerCase()}`, async () => {
      const { readModelByAgency } = await import("../chain/registry.js");
      return readModelByAgency(
        { clients: deps.clients, registry: deps.config.addresses.registry, cache: deps.recordCache },
        agency,
      );
    });

  const manifest = await fetchManifest(
    { manifestCache: deps.manifestCache, log: deps.log },
    record.manifestURI,
  ).catch((err) => {
    deps.log.warn({ err, slug: record.slug }, "manifest_fetch_failed");
    return null;
  });

  return rpcResult(undefined, {
    tools: [
      {
        name:        record.slug.replace(/[^a-zA-Z0-9_.-]/g, "_"),
        title:       manifest?.name ?? record.slug,
        description: manifest?.description
          ?? `Modula model — base ${record.baseModel}, type ${record.modelType}.`,
        inputSchema: manifest?.inputSchema ?? { type: "object" },
        ...(manifest?.outputSchema ? { outputSchema: manifest.outputSchema } : {}),
      },
    ],
  });
}

async function handleCallTool(
  deps: McpSvmDeps,
  c: Context,
  body: { id?: number | string; params?: unknown },
) {
  const record   = c.get("x402:record" as never) as ModelRecord;
  const agentPub = c.get("x402:agent"  as never) as string;
  const paid     = c.get("x402:paid"   as never) as bigint;
  const args     = (body.params as { arguments?: unknown } | undefined)?.arguments ?? {};

  const output = await callRuntime(
    { manifestCache: deps.manifestCache, log: deps.log },
    record,
    args,
  );

  const isStringOutput = typeof output === "string";
  const result = {
    content: [
      { type: "text", text: isStringOutput ? output : JSON.stringify(output) },
    ],
    ...(isStringOutput ? {} : { structuredContent: output }),
    isError: false,
  };

  void deps.log.info(
    { slug: record.slug, agent: agentPub, paid: paid.toString(), rail: "svm" },
    "tools_call_served_svm",
  );

  // Async on-chain access log — best-effort, mirrors EVM path.
  // SVM tx hashes are base58 strings, not 0x hex; the access router
  // currently expects bytes32 so the log call is skipped for SVM
  // until the on-chain registry adds an SVM-aware variant.
  queueMicrotask(() => {
    const txSig = c.get("x402:txHash" as never) as string | null | undefined;
    const lat   = (c.get("x402:latency" as never) as number | undefined) ?? 0;
    if (!txSig) return;
    deps.log.info(
      { slug: record.slug, txSig, lat, rail: "svm" },
      "svm_settle_logged_offchain",
    );
    // Intentional: no logAccess() call. The EVM access router expects
    // a bytes32 EVM tx hash, which would corrupt on-chain state if
    // we packed a base58 SVM signature into it. Tracked separately
    // — see SOLANA.md for the registry-side upgrade plan.
    void logAccess; // keep import live for symmetry with mcp.ts
  });

  return rpcResult(body.id, result);
}

function rpcResult(id: number | string | undefined, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: number | string | undefined, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
