/**
 * /v1/models/:slug/svm-calls — recent SVM-paid calls for one model.
 *
 * The EVM call history surfaces as `recent_calls` on /v1/models/:slug.
 * SVM call history is split out into its own route because the row
 * shape differs (base58 tx signature vs 0x bytes32, base58 payer vs
 * 20-byte EVM address). Mixing the two in a single array would force
 * every consumer to discriminate by string format.
 */
import { Hono } from "hono";
import { z }    from "zod";

import { NotFound, BadRequest } from "../errors.js";
import type { Database } from "../../db.js";

interface Deps { db: Database }

const Query = z.object({
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

interface SvmCallRow {
  tx_signature:  string;
  agent_pubkey:  string;
  paid_usdc:     string;
  network:       "solana" | "solana-devnet";
  slot:          string;
  ts:            Date;
  latency_ms:    number | null;
}

export function svmCalls(deps: Deps): Hono {
  const app = new Hono();

  app.get("/:slug/svm-calls", async (c) => {
    const slug = c.req.param("slug");
    if (!slug) throw BadRequest("missing slug");

    const parsed = Query.safeParse(c.req.query());
    if (!parsed.success) {
      throw BadRequest(parsed.error.errors.map((e) => e.message).join(", "));
    }
    const { limit, offset } = parsed.data;

    const { rows: model } = await deps.db.pool.query<{ id: Buffer }>(
      "SELECT id FROM models WHERE slug = $1",
      [slug],
    );
    if (model.length === 0) throw NotFound(`model ${slug}`);
    const modelId = model[0]!.id;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      deps.db.pool.query<SvmCallRow>(
        `SELECT tx_signature,
                agent_pubkey,
                paid_usdc::text  AS paid_usdc,
                network,
                slot::text       AS slot,
                ts,
                latency_ms
           FROM svm_calls
          WHERE model_id = $1
          ORDER BY ts DESC
          LIMIT $2 OFFSET $3`,
        [modelId, limit, offset],
      ),
      deps.db.pool.query<{ total: string }>(
        "SELECT COUNT(*)::text AS total FROM svm_calls WHERE model_id = $1",
        [modelId],
      ),
    ]);

    return c.json({
      items: rows.map((r) => ({
        tx_signature: r.tx_signature,
        agent_pubkey: r.agent_pubkey,
        paid_usdc:    r.paid_usdc,
        network:      r.network,
        slot:         Number(r.slot),
        ts:           r.ts.toISOString(),
        latency_ms:   r.latency_ms,
      })),
      total:  Number(countRows[0]?.total ?? "0"),
      limit,
      offset,
    });
  });

  return app;
}
