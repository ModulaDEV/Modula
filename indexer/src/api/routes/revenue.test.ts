import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Hono } from "hono";

import { revenue } from "./revenue.js";
import { jsonError } from "../errors.js";
import { setupTestDb, type TestDb } from "../../test-helpers/testdb.js";
import type { Database } from "../../db.js";
import { hexToBytea } from "../../listeners/hex.js";

describe("/v1/models/:slug/revenue", () => {
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
    app.route("/v1/models/:slug/revenue", revenue({ db: database }));
    app.onError((err, c) => jsonError(c, err));
  });

  afterAll(async () => { await db.teardown(); });
  beforeEach(async () => { await db.reset(); });

  test("404 on unknown slug", async () => {
    const res = await app.request("/v1/models/missing/revenue");
    expect(res.status).toBe(404);
  });

  test("400 on invalid period", async () => {
    const res = await app.request("/v1/models/x/revenue?period=99d");
    expect(res.status).toBe(400);
  });

  test("zero-filled 7-day window for a model with no calls", async () => {
    const id = hexToBytea("0x" + "11".repeat(32));
    const tx = hexToBytea("0x" + "aa".repeat(32));
    const addr = (b: string) => hexToBytea("0x" + b.repeat(20));

    await db.pool.query(
      `INSERT INTO models VALUES ($1,'lonely',$2,$3,$4,$5,'Llama','LoRA','ipfs://x',now(),$6)`,
      [id, addr("a1"), addr("a2"), addr("a3"), addr("a4"), tx],
    );

    const res = await app.request("/v1/models/lonely/revenue");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.period).toBe("7d");
    expect(body.buckets).toHaveLength(7);
    expect(body.total_calls).toBe(0);
    expect(parseFloat(body.total_paid_usdc)).toBe(0);
    for (const b of body.buckets) {
      expect(b.calls).toBe(0);
      expect(parseFloat(b.paid_usdc)).toBe(0);
      expect(b.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("aggregates today's calls into the last bucket", async () => {
    const id   = hexToBytea("0x" + "22".repeat(32));
    const tx1  = hexToBytea("0x" + "a1".repeat(32));
    const tx2  = hexToBytea("0x" + "a2".repeat(32));
    const tx3  = hexToBytea("0x" + "a3".repeat(32));
    const addr = (b: string) => hexToBytea("0x" + b.repeat(20));

    await db.pool.query(
      `INSERT INTO models VALUES ($1,'busy',$2,$3,$4,$5,'Llama','LoRA','ipfs://y',now(),$6)`,
      [id, addr("b1"), addr("b2"), addr("b3"), addr("b4"), tx1],
    );

    await db.pool.query(
      `INSERT INTO calls (tx_hash, model_id, agent, paid_usdc, latency_ms, ts) VALUES
         ($1,$2,$3,1.250000,42,now()),
         ($4,$5,$6,0.500000,99,now()),
         ($7,$8,$9,0.250000,30,now())`,
      [
        tx1, id, addr("c1"),
        tx2, id, addr("c1"),
        tx3, id, addr("c2"),
      ],
    );

    const res = await app.request("/v1/models/busy/revenue?period=30d");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.period).toBe("30d");
    expect(body.buckets).toHaveLength(30);
    expect(body.total_calls).toBe(3);
    expect(parseFloat(body.total_paid_usdc)).toBeCloseTo(2.0, 6);

    const last = body.buckets[body.buckets.length - 1];
    expect(last.calls).toBe(3);
    expect(parseFloat(last.paid_usdc)).toBeCloseTo(2.0, 6);
  });

  test("ignores calls older than the window", async () => {
    const id   = hexToBytea("0x" + "33".repeat(32));
    const tx1  = hexToBytea("0x" + "b1".repeat(32));
    const tx2  = hexToBytea("0x" + "b2".repeat(32));
    const addr = (b: string) => hexToBytea("0x" + b.repeat(20));

    await db.pool.query(
      `INSERT INTO models VALUES ($1,'old',$2,$3,$4,$5,'Llama','LoRA','ipfs://z',now(),$6)`,
      [id, addr("d1"), addr("d2"), addr("d3"), addr("d4"), tx1],
    );

    await db.pool.query(
      `INSERT INTO calls (tx_hash, model_id, agent, paid_usdc, latency_ms, ts) VALUES
         ($1,$2,$3,1.000000,10,now() - interval '40 days'),
         ($4,$5,$6,2.000000,20,now())`,
      [tx1, id, addr("e1"), tx2, id, addr("e2")],
    );

    const res7 = await app.request("/v1/models/old/revenue?period=7d");
    const body7 = await res7.json();
    expect(body7.total_calls).toBe(1);
    expect(parseFloat(body7.total_paid_usdc)).toBeCloseTo(2.0, 6);

    const res30 = await app.request("/v1/models/old/revenue?period=30d");
    const body30 = await res30.json();
    expect(body30.total_calls).toBe(1);
    expect(parseFloat(body30.total_paid_usdc)).toBeCloseTo(2.0, 6);
  });
});
