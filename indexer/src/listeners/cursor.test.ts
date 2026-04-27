import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { loadCursor, saveCursor } from "./cursor.js";
import { setupTestDb, type TestDb } from "../test-helpers/testdb.js";

describe("cursor", () => {
  let db: TestDb;

  beforeAll(async () => { db = await setupTestDb(); });
  afterAll(async () => { await db.teardown(); });
  beforeEach(async () => { await db.reset(); });

  test("loadCursor returns 0 for a freshly-seeded stream", async () => {
    expect(await loadCursor(db.pool, "ModelRegistered")).toBe(0n);
    expect(await loadCursor(db.pool, "Wrap")).toBe(0n);
  });

  test("saveCursor advances last_block and updated_at", async () => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      await saveCursor(client, "ModelRegistered", 12_345n);
      await client.query("COMMIT");
    } finally {
      client.release();
    }

    expect(await loadCursor(db.pool, "ModelRegistered")).toBe(12_345n);

    const { rows } = await db.pool.query<{ updated_at: Date }>(
      "SELECT updated_at FROM indexer_cursor WHERE event_name = $1",
      ["ModelRegistered"],
    );
    expect(rows[0]?.updated_at.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  test("saveCursor inside a rollback does not persist", async () => {
    const before = await loadCursor(db.pool, "Unwrap");

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      await saveCursor(client, "Unwrap", 999n);
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }

    expect(await loadCursor(db.pool, "Unwrap")).toBe(before);
  });

  test("each stream advances independently", async () => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      await saveCursor(client, "Wrap",   100n);
      await saveCursor(client, "Unwrap", 200n);
      await client.query("COMMIT");
    } finally {
      client.release();
    }

    expect(await loadCursor(db.pool, "Wrap")).toBe(100n);
    expect(await loadCursor(db.pool, "Unwrap")).toBe(200n);
    expect(await loadCursor(db.pool, "ModelRegistered")).toBe(0n);
  });
});
