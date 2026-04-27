/**
 * MCP route: POST /m/:agency/mcp
 *
 * Implements the JSON-RPC 2.0 surface of the Model Context Protocol
 * 2025-11-25 spec. Three methods routed:
 *
 *   - initialize   — capability handshake
 *   - tools/list   — return one tool descriptor (the model itself)
 *   - tools/call   — proxied to the model runtime, gated by x402
 *
 * The x402 middleware runs *before* this handler and short-circuits
 * tools/call requests that need payment. By the time we land here on
 * tools/call, the payment is verified (and settle is queued for after
 * we return).
 */
import { Hono }    from "hono";
import type { Context } from "hono";
import type { Address } from "viem";

import type { AppDeps }     from "../app.js";
import type { ModelRecord } from "../chain/registry.js";
import type { FacilitatorClient } from "../x402/facilitator.js";
import { x402Middleware }   from "../x402/middleware.js";
import { logAccess }        from "../chain/access.js";
import { BadRequest }       from "../errors.js";
import type { Clients }     from "../chain/clients.js";
import type { TtlCache }    from "../chain/cache.js";
import type { Quote }       from "../chain/agency.js";
import type { X402Network } from "../x402/types.js";
import { fetchManifest, callRuntime, type ModelManifest } from "../runtime.js";

interface McpDeps extends AppDeps {
  clients:       Clients;
  facilitator:   FacilitatorClient;
  recordCache:   TtlCache<string, ModelRecord>;
  quoteCache:    TtlCache<string, Quote>;
  manifestCache: TtlCache<string, ModelManifest>;
  network:       X402Network;
}

const PROTOCOL_VERSION = "2025-11-25";

export function mcp(deps: McpDeps): Hono {
  const app = new Hono();

  app.post(
    "/",
    x402Middleware({
      clients:     deps.clients,
      facilitator: deps.facilitator,
      registry:    deps.config.addresses.registry,
      recordCache: deps.recordCache,
      quoteCache:  deps.quoteCache,
      network:     deps.network,
      log:         deps.log,
    }),
    async (c) => {
      const body = c.get("rpc:body" as never) as { jsonrpc?: string; id?: number | string; method?: string; params?: unknown };
      if (!body || body.jsonrpc !== "2.0" || body.method == null) {
        throw new BadRequest("expected JSON-RPC 2.0 request");
      }

      switch (body.method) {
        case "initialize":
          return c.json(rpcResult(body.id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities:    { tools: { listChanged: false } },
            serverInfo:      { name: "modula-gateway", version: "0.1.0" },
          }));

        case "tools/list":
          return c.json(await handleListTools(deps, c));

        case "tools/call":
          return c.json(await handleCallTool(deps, c, body));

        default:
          return c.json(rpcError(body.id, -32601, `Method not found: ${body.method}`), 200);
      }
    },
  );

  return app;
}

// -------- handlers --------

async function handleListTools(deps: McpDeps, c: Context) {
  const agency = c.req.param("agency") as Address;
  const record = c.get("x402:record" as never) as ModelRecord | undefined
    ?? await deps.recordCache.getOrLoad(`agency:${agency.toLowerCase()}`, async () => {
      const { readModelByAgency } = await import("../chain/registry.js");
      return readModelByAgency(
        { clients: deps.clients, registry: deps.config.addresses.registry, cache: deps.recordCache },
        agency,
      );
    });

  // Manifest fetch is best-effort — a missing or malformed manifest
  // still yields a valid tools/list with the on-chain record's
  // baseline metadata, so discovery never fails on a creator's
  // misconfigured ipfs.
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

async function handleCallTool(deps: McpDeps, c: Context, body: { id?: number | string; params?: unknown }) {
  const record   = c.get("x402:record" as never)   as ModelRecord;
  const agentEoa = c.get("x402:agent" as never)    as Address;
  const paid     = c.get("x402:paid" as never)     as bigint;
  const args     = (body.params as { arguments?: unknown } | undefined)?.arguments ?? {};

  // Forward to the model's runtime endpoint. UpstreamError on any
  // failure (network, timeout, non-2xx, malformed output) bubbles
  // to Hono's onError, which serializes it as a 502 — payment is
  // already verified at this point but settle has not been invoked,
  // so the agent's authorization expires uncharged.
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
    { slug: record.slug, agent: agentEoa, paid: paid.toString() },
    "tools_call_served",
  );

  // Submit the on-chain receipt asynchronously after the response goes out.
  queueMicrotask(async () => {
    const txHash = c.get("x402:txHash" as never) as `0x${string}` | null | undefined;
    const lat    = (c.get("x402:latency" as never) as number | undefined) ?? 0;
    if (!txHash) return;
    try {
      await logAccess(
        {
          clients:      deps.clients,
          accessRouter: deps.config.addresses.accessRouter,
          log:          deps.log,
        },
        {
          modelId:   record.id,
          agent:     agentEoa,
          paidUSDC:  paid,
          latencyMs: lat,
          txHash,
        },
      );
    } catch (e) {
      deps.log.error({ err: e }, "access_log_failed");
    }
  });

  return rpcResult(body.id, result);
}

// -------- JSON-RPC helpers --------

function rpcResult(id: number | string | undefined, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function rpcError(id: number | string | undefined, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
