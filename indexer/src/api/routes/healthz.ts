/**
 * Liveness + readiness probe.
 *
 * Returns 200 with chain head, registry cursor, and the lag (in
 * blocks) between them. Fly + Railway hit this; PagerDuty alerts
 * fire when lag > threshold.
 *
 * 503 if pg or chain RPC fails — the pod is not ready to serve.
 */
import { Hono } from "hono";

import { loadCursor }  from "../../listeners/cursor.js";
import type { Database } from "../../db.js";
import type { PublicClient } from "viem";

interface Deps {
  db:     Database;
  client: PublicClient;
}

export function healthz(deps: Deps): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    try {
      const [chainHead, registryCursor] = await Promise.all([
        deps.client.getBlockNumber(),
        loadCursor(deps.db.pool, "ModelRegistered"),
      ]);
      const lag = chainHead - registryCursor;
      return c.json({
        ok:               true,
        chain_head:       chainHead.toString(),
        registry_cursor:  registryCursor.toString(),
        lag_blocks:       lag.toString(),
      });
    } catch (err) {
      return c.json(
        { ok: false, error: err instanceof Error ? err.message : String(err) },
        503,
      );
    }
  });

  return app;
}
