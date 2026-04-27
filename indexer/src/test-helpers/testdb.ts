/**
 * Shared per-test-file Postgres container + migration runner.
 *
 * Pattern:
 *
 *   import { setupTestDb, type TestDb } from "../test-helpers/testdb.js";
 *
 *   let db: TestDb;
 *   beforeAll(async () => { db = await setupTestDb(); });
 *   afterAll(async () => { await db.teardown(); });
 *   beforeEach(async () => { await db.reset(); });
 *
 * The container is reused across tests in one file (cheap), and
 * `reset()` TRUNCATEs the tables between tests (also cheap).
 * Migrations are applied once on setup.
 */
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(HERE, "../../migrations");

export interface TestDb {
  pool:     Pool;
  url:      string;
  /// TRUNCATE every domain table; reseed cursor rows. Fast — keeps
  /// the same container, just clears between tests.
  reset:    () => Promise<void>;
  teardown: () => Promise<void>;
}

export async function setupTestDb(): Promise<TestDb> {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("modula_test")
    .withUsername("postgres")
    .withPassword("postgres")
    .start();

  const url = container.getConnectionUri();
  const pool = new Pool({ connectionString: url });

  // Apply migrations in order.
  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, f), "utf-8");
    await pool.query(sql);
  }

  return {
    pool,
    url,
    async reset() {
      // Order respects FK CASCADE direction.
      await pool.query("TRUNCATE calls, curve_ticks, models RESTART IDENTITY CASCADE");
      await pool.query(
        `UPDATE indexer_cursor SET last_block = 0, updated_at = now()
         WHERE event_name IN ('ModelRegistered','Wrap','Unwrap','ModelCalled')`,
      );
    },
    async teardown() {
      await pool.end();
      await container.stop();
    },
  };
}
