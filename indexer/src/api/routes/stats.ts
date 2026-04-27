/**
 * /v1/stats — protocol-wide counters.
 *
 * Single SQL hit returning three numbers the landing page renders in
 * the metrics strip. Cached client-side for 30s in the frontend so
 * the indexer doesn't re-aggregate on every page view.
 */
import { Hono } from "hono";
import type { Database } from "../../db.js";

interface Deps { db: Database }

interface StatsRow {
  total_models:      string;
  total_calls:       string;
  total_usdc_routed: string;
}

export function stats(deps: Deps): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    const { rows } = await deps.db.pool.query<StatsRow>(
      `SELECT
         (SELECT COUNT(*)::text FROM models)                                AS total_models,
         (SELECT COUNT(*)::text FROM calls)                                 AS total_calls,
         (SELECT COALESCE(SUM(paid_usdc), 0)::text FROM calls)              AS total_usdc_routed`,
    );
    const r = rows[0];
    return c.json({
      total_models:      Number(r?.total_models      ?? "0"),
      total_calls:       Number(r?.total_calls       ?? "0"),
      total_usdc_routed: r?.total_usdc_routed        ?? "0",
    });
  });

  return app;
}
