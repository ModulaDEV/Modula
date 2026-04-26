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

import type { Config } from "./config.js";
import type { Logger } from "./log.js";

export interface AppDeps {
  config: Config;
  log:    Logger;
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

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

  // MCP and x402 routes are wired in subsequent commits.

  // 404 fallback
  app.notFound((c) => c.json({ error: { code: "not_found", message: "no route" } }, 404));

  return app;
}
