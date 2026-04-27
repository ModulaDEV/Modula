/**
 * Model runtime adapter.
 *
 * Closes the loop on tools/call: after the x402 middleware verifies
 * payment we forward the agent's arguments to the creator-hosted
 * inference endpoint declared in the model's manifest, then return
 * the output as the MCP tool result.
 *
 * Two responsibilities live here:
 *   1. fetchManifest(uri) — resolve the on-chain manifestURI (ipfs://
 *      or https://) into a ModelManifest. TTL-cached because the
 *      manifest rarely changes within a session.
 *   2. callRuntime(model, args) — POST { input: args } to the
 *      manifest's runtime.url, return its { output }. AbortController
 *      enforces a per-call timeout; fetch / non-2xx failures map to
 *      UpstreamError so Hono's error handler responds 502, never 500.
 *
 * A future signature layer will add a signed header here so the
 * runtime can verify requests came from the gateway. The proxy
 * code stays the same — only the headers map grows.
 */
import { z } from "zod";

import { UpstreamError } from "./errors.js";
import type { TtlCache } from "./chain/cache.js";
import type { ModelRecord } from "./chain/registry.js";
import type { Logger } from "./log.js";

// -------- Schema --------

const ManifestSchema = z.object({
  name:         z.string().optional(),
  description:  z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  inputSchema:  z.record(z.unknown()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  runtime: z.object({
    url:       z.string().url(),
    timeoutMs: z.number().int().min(1_000).max(300_000).optional(),
  }),
});

export type ModelManifest = z.infer<typeof ManifestSchema>;

const RuntimeOutputSchema = z.object({ output: z.unknown() });

// -------- Deps --------

export interface RuntimeDeps {
  manifestCache:   TtlCache<string, ModelManifest>;
  log:             Logger;
  /** Fallback timeout when the manifest doesn't specify one. */
  defaultTimeoutMs?: number;
  /** IPFS gateway prefix; defaults to ipfs.io. */
  ipfsGateway?:    string;
}

// -------- Public API --------

/// @notice Resolve a model's on-chain manifestURI to a ModelManifest.
///         Cached 5 minutes by URI.
export async function fetchManifest(
  deps: RuntimeDeps,
  manifestURI: string,
): Promise<ModelManifest> {
  return deps.manifestCache.getOrLoad(
    manifestURI,
    async () => {
      const url = manifestUrlOf(deps, manifestURI);
      let res: Response;
      try {
        res = await fetch(url, { headers: { accept: "application/json" } });
      } catch (cause) {
        throw new UpstreamError(`manifest fetch ${url}`, cause);
      }
      if (!res.ok) {
        throw new UpstreamError(`manifest fetch ${url} → ${res.status} ${res.statusText}`);
      }
      let json: unknown;
      try {
        json = await res.json();
      } catch (cause) {
        throw new UpstreamError(`manifest parse ${url}`, cause);
      }
      const parsed = ManifestSchema.safeParse(json);
      if (!parsed.success) {
        throw new UpstreamError(
          `manifest invalid ${url}: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
        );
      }
      return parsed.data;
    },
    5 * 60_000,
  );
}

/// @notice Forward the agent's arguments to the model's runtime,
///         return the output. Throws UpstreamError on any failure
///         (network, timeout, non-2xx, malformed output).
export async function callRuntime(
  deps: RuntimeDeps,
  model: ModelRecord,
  args: unknown,
): Promise<unknown> {
  const manifest = await fetchManifest(deps, model.manifestURI);
  const url       = manifest.runtime.url;
  const timeoutMs = manifest.runtime.timeoutMs
    ?? deps.defaultTimeoutMs
    ?? 60_000;

  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(new Error("runtime call timed out")), timeoutMs);

  let res: Response;
  try {
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type":         "application/json",
          accept:                 "application/json",
          "x-modula-model-id":    model.id,
          "x-modula-model-slug":  model.slug,
        },
        body:   JSON.stringify({ input: args }),
        signal: ctrl.signal,
      });
    } catch (cause) {
      throw new UpstreamError(`runtime ${url}`, cause);
    }

    if (!res.ok) {
      // Drain the body for the error message but cap the size.
      const snippet = await safeReadText(res);
      throw new UpstreamError(
        `runtime ${url} → ${res.status} ${res.statusText}${snippet ? ` · ${snippet}` : ""}`,
      );
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch (cause) {
      throw new UpstreamError(`runtime ${url} returned non-JSON`, cause);
    }
    const parsed = RuntimeOutputSchema.safeParse(body);
    if (!parsed.success) {
      throw new UpstreamError(`runtime ${url} response missing { output }`);
    }
    return parsed.data.output;
  } finally {
    clearTimeout(t);
  }
}

// -------- Internals --------

function manifestUrlOf(deps: RuntimeDeps, uri: string): string {
  if (uri.startsWith("ipfs://")) {
    const gateway = (deps.ipfsGateway ?? "https://ipfs.io").replace(/\/+$/, "");
    return `${gateway}/ipfs/${uri.slice("ipfs://".length)}`;
  }
  return uri;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 200).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
