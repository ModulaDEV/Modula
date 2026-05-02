import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Hono } from "hono";

import { stats } from "./stats.js";
import { setupTestDb, type TestDb } from "../../test-helpers/testdb.js";
import type { Database } from "../../db.js";
import { hexToBytea } from "../../listeners/hex.js";

describe("/v1/stats", () => {
  let db: TestDb;
  let app: Hono;

  beforeAll(async () => {
    db = await setupTestDb();
    const database: Database = {
      pool: db.pool,
      withTx: async (fn) => {
        const c = await db.pool.connect();
        try {
          await c.query("BEGIN");
          const r = await fn(c);
          await c.query("COMMIT");
          return r;
        } catch (e) { await c.query("ROLLBACK"); throw e; } finally { c.release(); }
      },
      close: async () => {},
    };
    app = new Hono();
    app.route("/v1/stats", stats({ db: database }));
  });

  afterAll(async () => { await db.teardown(); });
  beforeEach(async () => { await db.reset(); });

  test("zero-state — all counters at 0", async () => {
    const res = await app.request("/v1/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      total_models:      0,
      total_calls:       0,
      total_usdc_routed: "0.000000",
      by_rail: {
        evm: { total_calls: 0, total_paid_usdc: "0" },
        svm: { total_calls: 0, total_paid_usdc: "0.000000" },
      },
    });
  });

  test("aggregates across models + calls", async () => {
    const id1 = hexToBytea("0x" + "11".repeat(32));
    const id2 = hexToBytea("0x" + "22".repeat(32));
    const tx1 = hexToBytea("0x" + "aa".repeat(32));
    const tx2 = hexToBytea("0x" + "bb".repeat(32));
    const tx3 = hexToBytea("0x" + "cc".repeat(32));
    const addr = (b: string) => hexToBytea("0x" + b.repeat(20));

    await db.pool.query(
      `INSERT INTO models VALUES
         ($1,'one',$2,$3,$4,$5,'Llama','LoRA','ipfs://x',now(),$6),
         ($7,'two',$8,$9,$10,$11,'Llama','LoRA','ipfs://y',now(),$12)`,
      [
        id1, addr("a1"), addr("a2"), addr("a3"), addr("a4"), tx1,
        id2, addr("b1"), addr("b2"), addr("b3"), addr("b4"), tx2,
      ],
    );

    await db.pool.query(
      `INSERT INTO calls (tx_hash, model_id, agent, paid_usdc, latency_ms, ts) VALUES
         ($1,$2,$3,1.250000,42,now()),
         ($4,$5,$6,0.500000,99,now()),
         ($7,$8,$9,2.000000,30,now())`,
      [
        tx1, id1, addr("c1"),
        tx2, id1, addr("c1"),
        tx3, id2, addr("c2"),
      ],
    );

    const res = await app.request("/v1/stats");
    const body = await res.json();
    expect(body.total_models).toBe(2);
    expect(body.total_calls).toBe(3);
    expect(parseFloat(body.total_usdc_routed)).toBeCloseTo(3.75, 6);
    // EVM-only fixture — SVM rail should still be at zero.
    expect(body.by_rail.evm.total_calls).toBe(3);
    expect(body.by_rail.svm.total_calls).toBe(0);
  });
});
