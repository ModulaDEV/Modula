/**
 * Cross-rail (EVM + SVM) stats helpers.
 *
 * The indexer's existing /v1/stats route reads only the `calls`
 * (EVM) table. As SVM-paid calls land in `svm_calls`, the stats
 * route needs to UNION over both. The two helpers here let routes
 * compose those reads cleanly without leaking SQL into the route
 * file itself.
 *
 * Returned amounts are exact 6-decimal strings (matches the EVM
 * stats serializer convention).
 */
import type { Pool } from "pg";

export interface SvmCallTotals {
  total_calls:     number;
  total_paid_usdc: string;
}

/// @notice Aggregate (count, sum(paid_usdc)) over svm_calls. Returns
///         { 0, "0.000000" } when the table is empty rather than null
///         so call sites never have to nil-coalesce.
export async function svmCallTotals(pool: Pool): Promise<SvmCallTotals> {
  const { rows } = await pool.query<{ c: string; s: string | null }>(
    `SELECT COUNT(*)::text AS c,
            COALESCE(SUM(paid_usdc), 0)::text AS s
       FROM svm_calls`,
  );
  const r = rows[0]!;
  return {
    total_calls:     Number(r.c),
    total_paid_usdc: r.s ?? "0.000000",
  };
}

/// @notice Same shape as svmCallTotals, scoped to one model id.
///         Used by the per-model detail route to surface SVM-side
///         revenue alongside the existing EVM aggregates.
export async function svmCallTotalsForModel(
  pool: Pool,
  modelId: Buffer,
): Promise<SvmCallTotals> {
  const { rows } = await pool.query<{ c: string; s: string | null }>(
    `SELECT COUNT(*)::text AS c,
            COALESCE(SUM(paid_usdc), 0)::text AS s
       FROM svm_calls
      WHERE model_id = $1`,
    [modelId],
  );
  const r = rows[0]!;
  return {
    total_calls:     Number(r.c),
    total_paid_usdc: r.s ?? "0.000000",
  };
}
