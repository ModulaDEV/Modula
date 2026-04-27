/**
 * Postgres connection pool.
 *
 * One pool per process. The indexer's hot path is small per-event INSERTs
 * plus an UPDATE to indexer_cursor — no long-running transactions and no
 * per-request connections, so a default `max: 10` pool comfortably covers
 * both the listener and the read API.
 *
 * Test / Anvil deployments wire DATABASE_URL to a testcontainers Postgres;
 * production points at the Railway-managed instance.
 */
import { Pool, type PoolConfig, type PoolClient } from "pg";

import type { Config } from "./config.js";
import type { Logger } from "./log.js";

export interface Database {
  pool: Pool;
  /// @notice Run `fn` inside a single transaction. Commits on success,
  ///         rolls back on throw. Used by listeners so cursor advance
  ///         and event inserts land atomically.
  withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
  /// @notice Closes all pool connections. Used during graceful shutdown.
  close(): Promise<void>;
}

export function createDatabase(config: Config, log: Logger): Database {
  const cfg: PoolConfig = {
    connectionString: config.DATABASE_URL,
    max:              config.DATABASE_POOL_MAX,
    // Long enough to survive a Railway primary failover; short enough
    // that a stuck connection is noticed.
    idleTimeoutMillis:       30_000,
    connectionTimeoutMillis: 10_000,
    application_name:        "modula-indexer",
  };

  const pool = new Pool(cfg);

  pool.on("error", (err) => {
    // Idle clients can disconnect; the pool reconnects on next checkout.
    // Surface so we can alert if it spikes.
    log.error({ err }, "pg_pool_error");
  });

  async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const out = await fn(client);
      await client.query("COMMIT");
      return out;
    } catch (e) {
      try { await client.query("ROLLBACK"); } catch { /* swallow rollback errors */ }
      throw e;
    } finally {
      client.release();
    }
  }

  return {
    pool,
    withTx,
    async close() {
      await pool.end();
    },
  };
}
