/**
 * Per-event-stream replay cursor.
 *
 * One row per stream in `indexer_cursor` (seeded by 002_cursor.sql).
 * loadCursor reads the last fully-processed block; saveCursor advances
 * it. saveCursor takes a PoolClient because it must run in the same
 * transaction as the data inserts — otherwise a crash between INSERT
 * and UPDATE would silently re-ingest events on next boot.
 */
import type { Pool, PoolClient } from "pg";

export type EventStream =
  | "ModelRegistered"
  | "Wrap"
  | "Unwrap"
  | "ModelCalled";

export async function loadCursor(pool: Pool, stream: EventStream): Promise<bigint> {
  const { rows } = await pool.query<{ last_block: string }>(
    "SELECT last_block::text AS last_block FROM indexer_cursor WHERE event_name = $1",
    [stream],
  );
  if (rows.length === 0) return 0n;
  return BigInt(rows[0]!.last_block);
}

export async function saveCursor(
  client: PoolClient,
  stream: EventStream,
  lastBlock: bigint,
): Promise<void> {
  await client.query(
    "UPDATE indexer_cursor SET last_block = $1, updated_at = now() WHERE event_name = $2",
    [lastBlock.toString(), stream],
  );
}
