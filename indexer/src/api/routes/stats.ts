/**
 * /v1/stats — protocol-wide counters.
 *
 * Single SQL hit returning three numbers the landing page renders in
 * the metrics strip. Cached client-side for 30s in the frontend so
 * the indexer doesn't re-aggregate on every page view.
 */
import { Hono } from "hono";
import type { Database } from "../../db.js";
import { svmCallTotals } from "../svm-stats.js";

interface Deps { db: Database }

interface StatsRow {
  total_models:      string;
  total_calls:       string;
  total_usdc_routed: string;
}

export function stats(deps: Deps): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    const [{ rows }, svm] = await Promise.all([
      deps.db.pool.query<StatsRow>(
        `SELECT
           (SELECT COUNT(*)::text FROM models)                                AS total_models,
           (SELECT COUNT(*)::text FROM calls)                                 AS total_calls,
           (SELECT COALESCE(SUM(paid_usdc), 0)::text FROM calls)              AS total_usdc_routed`,
      ),
      svmCallTotals(deps.db.pool),
    ]);
    const r = rows[0];

    const evmCalls = Number(r?.total_calls ?? "0");
    const evmUsdc  = r?.total_usdc_routed ?? "0";

    // Sum EVM + SVM into the cross-rail totals while exposing the
    // per-rail breakdown so dashboards can chart them separately
    // without doing the math themselves.
    const total_calls       = evmCalls + svm.total_calls;
    const total_usdc_routed = sumDecimal(evmUsdc, svm.total_paid_usdc);

    return c.json({
      total_models:      Number(r?.total_models ?? "0"),
      total_calls,
      total_usdc_routed,
      by_rail: {
        evm: { total_calls: evmCalls,         total_paid_usdc: evmUsdc },
        svm: { total_calls: svm.total_calls,  total_paid_usdc: svm.total_paid_usdc },
      },
    });
  });

  return app;
}

/**
 * Sum two exact 6-decimal USDC strings without bigint conversion.
 * Postgres NUMERIC(38,6) round-trips as a string, so we keep the
 * arithmetic in string-decimal space to preserve the exact representation.
 */
function sumDecimal(a: string, b: string): string {
  const SCALE = 1_000_000n;
  const toUnits = (s: string): bigint => {
    const [whole, frac = ""] = s.split(".");
    return BigInt((whole ?? "0") + frac.padEnd(6, "0").slice(0, 6));
  };
  const sum = toUnits(a) + toUnits(b);
  const whole = sum / SCALE;
  const frac  = sum % SCALE;
  return `${whole.toString()}.${frac.toString().padStart(6, "0")}`;
}
