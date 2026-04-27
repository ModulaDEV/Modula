/**
 * /v1/models/:slug/ticks — time-series curve ticks for charts.
 *
 * Two consumers:
 *   - the model detail page on first load (no `since`) — shows the
 *     latest `limit` ticks ascending so the chart reads left→right.
 *   - the same page on a re-poll (`since=<last_seen_ts>`) — appends
 *     only the new ticks since the last fetch, keeping live updates
 *     cheap.
 *
 * Pagination back through deep history is intentionally out of scope
 * for v1; the model detail view shows the recent window and that's
 * all the registry UI needs.
 */
import { Hono } from "hono";
import { z }    from "zod";

import { serializeTick, type TickRow } from "../serializers.js";
import { BadRequest, NotFound }        from "../errors.js";
import type { Database }               from "../../db.js";

interface Deps { db: Database }

const Query = z.object({
  since: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(1_000).default(100),
});

export function ticks(deps: Deps): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    const slug = c.req.param("slug");
    if (!slug) throw BadRequest("missing slug");

    const parsed = Query.safeParse(c.req.query());
    if (!parsed.success) {
      throw BadRequest(parsed.error.errors.map((e) => e.message).join(", "));
    }
    const { since, limit } = parsed.data;

    // Verify the model exists so a missing slug returns 404 rather
    // than an empty list silently.
    const { rows: modelRows } = await deps.db.pool.query<{ id: Buffer }>(
      "SELECT id FROM models WHERE slug = $1",
      [slug],
    );
    const model = modelRows[0];
    if (!model) throw NotFound(`model ${slug}`);

    if (since) {
      const { rows } = await deps.db.pool.query<TickRow>(
        `SELECT block_number::text AS block_number,
                tx_hash, kind,
                supply_after::text AS supply_after,
                price_usdc::text   AS price_usdc, ts
           FROM curve_ticks
          WHERE model_id = $1 AND ts > $2
          ORDER BY ts ASC
          LIMIT $3`,
        [model.id, since, limit],
      );
      return c.json({
        items: rows.map(serializeTick),
        next_since: rows.length > 0
          ? rows[rows.length - 1]!.ts.toISOString()
          : since,
      });
    }

    // No `since`: latest `limit` ticks, returned ASC for chart consumption.
    const { rows } = await deps.db.pool.query<TickRow>(
      `WITH latest AS (
         SELECT block_number, tx_hash, kind, supply_after, price_usdc, ts
           FROM curve_ticks
          WHERE model_id = $1
          ORDER BY ts DESC
          LIMIT $2
       )
       SELECT block_number::text AS block_number,
              tx_hash, kind,
              supply_after::text AS supply_after,
              price_usdc::text   AS price_usdc, ts
         FROM latest
        ORDER BY ts ASC`,
      [model.id, limit],
    );
    return c.json({
      items: rows.map(serializeTick),
      next_since: rows.length > 0
        ? rows[rows.length - 1]!.ts.toISOString()
        : null,
    });
  });

  return app;
}
