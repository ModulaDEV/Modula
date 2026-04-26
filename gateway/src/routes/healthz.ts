/**
 * Liveness + readiness probes.
 *
 * - GET /healthz/live   process is up and responding (used by Fly's
 *                       built-in liveness probe — never fails)
 * - GET /healthz/ready  process is up *and* upstream RPC is reachable;
 *                       fails -> 503 so the load balancer drains us
 */
import { Hono } from "hono";
import type { AppDeps } from "../app.js";

export function healthz(_deps: AppDeps): Hono {
  const app = new Hono();

  app.get("/live", (c) =>
    c.json({ status: "live", uptime: process.uptime(), pid: process.pid }),
  );

  app.get("/ready", async (c) => {
    // We'll hook into chain reads in a later commit. For now we report
    // ready=true unconditionally; the readiness check upgrades to a
    // real RPC ping when src/chain/clients.ts lands.
    return c.json({ status: "ready" });
  });

  return app;
}
