/**
 * /v1/models routes — list + detail.
 *
 * Both routes join models with three derived tables:
 *   stats       — aggregated calls + USDC routed (from `calls`)
 *   latest_tick — last (block_number-ordered) curve tick (from `curve_ticks`)
 *   sparkline   — array of the most recent 12 prices (for the registry chart)
 *
 * The list query is the heaviest in the API. It runs three CTEs and
 * leftjoins them; with the `models_registered_at_idx`, `calls_model_ts_idx`,
 * and `curve_ticks_model_ts_idx` from 001_init.sql it scans linearly per
 * page and serves <50ms at expected v1 scale (a few hundred models).
 */
import { Hono } from "hono";
import { z }    from "zod";

import { serializeModel, serializeTick, serializeCall, type ModelRow, type TickRow, type CallRow } from "../serializers.js";
import { NotFound, BadRequest } from "../errors.js";
import { svmCallTotalsForModel } from "../svm-stats.js";
import { sumUsdc } from "../decimal.js";
import type { Database } from "../../db.js";

interface Deps { db: Database }

const ListQuery = z.object({
  type:   z.string().min(1).max(64).optional(),
  base:   z.string().min(1).max(64).optional(),
  q:      z.string().min(1).max(128).optional(),
  tag:    z.string().min(1).max(64).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export function models(deps: Deps): Hono {
  const app = new Hono();

  // ---------- /v1/models ----------
  app.get("/", async (c) => {
    const parsed = ListQuery.safeParse(c.req.query());
    if (!parsed.success) {
      throw BadRequest(parsed.error.errors.map((e) => e.message).join(", "));
    }
    const { type, base, q, tag, limit, offset } = parsed.data;

    // Build parameterised WHERE / JOIN clauses dynamically so unused
    // filters don't appear in the query at all.
    const p: unknown[] = [];
    const where: string[] = [];
    let tagJoin  = "";
    let orderBy  = "m.registered_at DESC";

    if (type) { p.push(type); where.push(`m.model_type = $${p.length}`); }
    if (base) { p.push(base); where.push(`m.base_model = $${p.length}`); }
    if (tag)  {
      p.push(tag);
      tagJoin = `JOIN model_tags mt ON mt.model_id = m.id AND mt.tag = $${p.length}`;
    }
    if (q) {
      p.push(q);
      where.push(`m.search_vec @@ plainto_tsquery('english', $${p.length})`);
      orderBy = `ts_rank(m.search_vec, plainto_tsquery('english', $${p.length})) DESC`;
    }

    const whereClause  = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const listParams   = [...p, limit, offset];
    const countParams  = [...p];

    const listSql = `
      WITH stats AS (
        SELECT model_id,
               COUNT(*)::text                               AS calls,
               COALESCE(SUM(paid_usdc), 0)::text            AS total_paid_usdc
        FROM calls
        GROUP BY model_id
      ),
      latest_tick AS (
        SELECT DISTINCT ON (model_id)
               model_id,
               supply_after::text                           AS latest_supply,
               price_usdc::text                             AS latest_price_usdc
        FROM curve_ticks
        ORDER BY model_id, block_number DESC, tx_hash DESC
      ),
      sparkline AS (
        SELECT model_id,
               array_agg(price_usdc::text ORDER BY ts ASC) AS trend
        FROM (
          SELECT model_id, price_usdc, ts,
                 ROW_NUMBER() OVER (PARTITION BY model_id ORDER BY ts DESC) AS rn
          FROM curve_ticks
        ) t
        WHERE rn <= 12
        GROUP BY model_id
      )
      SELECT m.id, m.slug, m.agency, m.app, m.creator, m.treasury,
             m.base_model, m.model_type, m.manifest_uri,
             m.registered_at, m.registered_tx,
             COALESCE(s.calls, '0')           AS calls,
             COALESCE(s.total_paid_usdc, '0') AS total_paid_usdc,
             lt.latest_supply,
             lt.latest_price_usdc,
             sp.trend
        FROM models m
        ${tagJoin}
   LEFT JOIN stats       s  ON s.model_id  = m.id
   LEFT JOIN latest_tick lt ON lt.model_id = m.id
   LEFT JOIN sparkline   sp ON sp.model_id = m.id
        ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}
    `;
    const countSql = `
      SELECT COUNT(*)::text AS total
        FROM models m
        ${tagJoin}
        ${whereClause}
    `;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      deps.db.pool.query<ModelRow>(listSql, listParams),
      deps.db.pool.query<{ total: string }>(countSql, countParams),
    ]);

    return c.json({
      items:  rows.map(serializeModel),
      total:  Number(countRows[0]?.total ?? "0"),
      limit,
      offset,
    });
  });

  // ---------- /v1/models/:slug ----------
  app.get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    if (!slug) throw BadRequest("missing slug");

    const detailSql = `
      WITH stats AS (
        SELECT model_id,
               COUNT(*)::text                    AS calls,
               COALESCE(SUM(paid_usdc), 0)::text AS total_paid_usdc
        FROM calls
        WHERE model_id = (SELECT id FROM models WHERE slug = $1)
        GROUP BY model_id
      ),
      latest_tick AS (
        SELECT DISTINCT ON (model_id)
               model_id,
               supply_after::text AS latest_supply,
               price_usdc::text   AS latest_price_usdc
        FROM curve_ticks
        WHERE model_id = (SELECT id FROM models WHERE slug = $1)
        ORDER BY model_id, block_number DESC, tx_hash DESC
      ),
      sparkline AS (
        SELECT model_id,
               array_agg(price_usdc::text ORDER BY ts ASC) AS trend
        FROM (
          SELECT model_id, price_usdc, ts,
                 ROW_NUMBER() OVER (PARTITION BY model_id ORDER BY ts DESC) AS rn
          FROM curve_ticks
          WHERE model_id = (SELECT id FROM models WHERE slug = $1)
        ) t
        WHERE rn <= 12
        GROUP BY model_id
      )
      SELECT m.id, m.slug, m.agency, m.app, m.creator, m.treasury,
             m.base_model, m.model_type, m.manifest_uri,
             m.registered_at, m.registered_tx,
             COALESCE(s.calls, '0')           AS calls,
             COALESCE(s.total_paid_usdc, '0') AS total_paid_usdc,
             lt.latest_supply,
             lt.latest_price_usdc,
             sp.trend
        FROM models m
   LEFT JOIN stats       s  ON s.model_id  = m.id
   LEFT JOIN latest_tick lt ON lt.model_id = m.id
   LEFT JOIN sparkline   sp ON sp.model_id = m.id
       WHERE m.slug = $1
    `;
    const ticksSql = `
      SELECT block_number::text AS block_number,
             tx_hash, kind, supply_after::text AS supply_after,
             price_usdc::text   AS price_usdc, ts
        FROM curve_ticks
       WHERE model_id = (SELECT id FROM models WHERE slug = $1)
       ORDER BY ts DESC
       LIMIT 12
    `;
    const callsSql = `
      SELECT tx_hash, agent, paid_usdc::text AS paid_usdc, latency_ms, ts
        FROM calls
       WHERE model_id = (SELECT id FROM models WHERE slug = $1)
       ORDER BY ts DESC
       LIMIT 10
    `;

    const [{ rows }, { rows: ticks }, { rows: calls }] = await Promise.all([
      deps.db.pool.query<ModelRow>(detailSql, [slug]),
      deps.db.pool.query<TickRow>(ticksSql, [slug]),
      deps.db.pool.query<CallRow>(callsSql, [slug]),
    ]);

    const row = rows[0];
    if (!row) throw NotFound(`model ${slug}`);

    // Cross-rail revenue: sum EVM + SVM totals for this model. The
    // top-level `calls` and `total_paid_usdc` fields stay as the
    // sum so existing clients see the unified number; `by_rail`
    // exposes the per-rail breakdown for dashboards that want it.
    const svm = await svmCallTotalsForModel(deps.db.pool, row.id);
    const evmCalls = row.calls !== undefined ? Number(row.calls) : 0;
    const evmUsdc  = row.total_paid_usdc ?? "0";

    const serialized = serializeModel(row);

    return c.json({
      ...serialized,
      calls:           evmCalls + svm.total_calls,
      total_paid_usdc: sumUsdc(evmUsdc, svm.total_paid_usdc),
      by_rail: {
        evm: { total_calls: evmCalls,        total_paid_usdc: evmUsdc },
        svm: { total_calls: svm.total_calls, total_paid_usdc: svm.total_paid_usdc },
      },
      recent_ticks: ticks.map(serializeTick),
      recent_calls: calls.map(serializeCall),
    });
  });

  return app;
}
