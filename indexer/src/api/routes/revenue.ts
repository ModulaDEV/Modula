/**
 * /v1/models/:slug/revenue — daily revenue + call-count buckets.
 *
 * Powers the creator revenue dashboard on the model detail page.
 * Returns one bucket per UTC day in the requested window, zero-filled
 * so consumers can render a continuous sparkline without gap handling.
 *
 * The window is inclusive of today and extends backward N-1 days, so
 * ?period=7d returns 7 buckets and ?period=30d returns 30.
 */
import { Hono } from "hono";
import { z }    from "zod";

import { BadRequest, NotFound } from "../errors.js";
import type { Database }        from "../../db.js";

interface Deps { db: Database }

const Query = z.object({
  period: z.enum(["7d", "30d"]).default("7d"),
});

interface BucketRow {
  day:       string;
  calls:     string;
  paid_usdc: string;
}

export function revenue(deps: Deps): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    const slug = c.req.param("slug");
    if (!slug) throw BadRequest("missing slug");

    const parsed = Query.safeParse(c.req.query());
    if (!parsed.success) {
      throw BadRequest(parsed.error.errors.map((e) => e.message).join(", "));
    }
    const days = parsed.data.period === "30d" ? 30 : 7;

    const { rows: modelRows } = await deps.db.pool.query<{ id: Buffer }>(
      "SELECT id FROM models WHERE slug = $1",
      [slug],
    );
    const model = modelRows[0];
    if (!model) throw NotFound(`model ${slug}`);

    const { rows } = await deps.db.pool.query<BucketRow>(
      `WITH days AS (
         SELECT generate_series(
           date_trunc('day', NOW() AT TIME ZONE 'UTC') - ($2::int - 1) * interval '1 day',
           date_trunc('day', NOW() AT TIME ZONE 'UTC'),
           interval '1 day'
         )::date AS day
       ),
       agg AS (
         SELECT date_trunc('day', ts AT TIME ZONE 'UTC')::date AS day,
                COUNT(*)::text                                  AS calls,
                COALESCE(SUM(paid_usdc), 0)::text               AS paid_usdc
           FROM calls
          WHERE model_id = $1
            AND ts >= date_trunc('day', NOW() AT TIME ZONE 'UTC') - ($2::int - 1) * interval '1 day'
          GROUP BY 1
       )
       SELECT to_char(d.day, 'YYYY-MM-DD')         AS day,
              COALESCE(a.calls, '0')               AS calls,
              COALESCE(a.paid_usdc, '0.000000')    AS paid_usdc
         FROM days d
    LEFT JOIN agg  a ON a.day = d.day
        ORDER BY d.day ASC`,
      [model.id, days],
    );

    let totalCalls = 0;
    let totalUsdc  = 0;
    const buckets = rows.map((r) => {
      const calls = Number(r.calls);
      totalCalls += calls;
      totalUsdc  += Number(r.paid_usdc);
      return { day: r.day, calls, paid_usdc: r.paid_usdc };
    });

    return c.json({
      period:          parsed.data.period,
      buckets,
      total_calls:     totalCalls,
      total_paid_usdc: totalUsdc.toFixed(6),
    });
  });

  return app;
}
