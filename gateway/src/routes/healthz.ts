/**
 * Liveness + readiness probes.
 *
 * - GET /healthz        the canonical "is this thing alive" probe used
 *                       by load balancers / DO App Platform / k8s. Same
 *                       semantics as /healthz/live; included so the
 *                       default probe path works without configuration.
 * - GET /healthz/live   explicit liveness probe (process is up).
 * - GET /healthz/ready  liveness *plus* upstream RPC reachable; fails
 *                       with 503 so the load balancer drains us cleanly.
 */
import { Hono } from "hono";
import type { Context } from "hono";
import type { AppDeps } from "../app.js";

export function healthz(_deps: AppDeps): Hono {
  const app = new Hono();

  const live = (c: Context) =>
    c.json({ status: "live", uptime: process.uptime(), pid: process.pid });

  app.get("/", live);
  app.get("/live", live);

  app.get("/ready", async (c) => {
    // We'll hook into chain reads in a later commit. For now we report
    // ready=true unconditionally; the readiness check upgrades to a
    // real RPC ping when src/chain/clients.ts lands.
    return c.json({ status: "ready" });
  });

  return app;
}
