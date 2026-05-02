/**
 * SVM event-source cursor.
 *
 * The EVM listeners track progress with a (stream, block_number)
 * tuple. The SVM event source can't do that — the on-chain object
 * the indexer follows is a stream of *signatures* under one program-
 * derived address (the Modula treasury or its USDC ATA), not a block
 * range. The natural cursor is the last signature observed.
 *
 * Wire format in `svm_indexer_cursor`:
 *   - stream:        text       (e.g. "USDCTransfer")
 *   - last_signature text       base58 tx signature
 *   - last_slot      bigint     informational; lets ops eyeball lag
 *   - updated_at     timestamptz
 */
import type { Pool } from "pg";

export interface SvmCursor {
  stream:         string;
  last_signature: string | null;
  last_slot:      bigint;
}

/// @notice Initial cursor used the first time the indexer boots — no
///         signature observed yet, slot 0.
export const EMPTY_CURSOR: Omit<SvmCursor, "stream"> = {
  last_signature: null,
  last_slot:      0n,
};

export async function loadSvmCursor(
  pool: Pool,
  stream: string,
): Promise<SvmCursor> {
  const { rows } = await pool.query<{
    last_signature: string | null;
    last_slot:      string | null;
  }>(
    `SELECT last_signature, last_slot
       FROM svm_indexer_cursor
      WHERE stream = $1`,
    [stream],
  );
  if (rows.length === 0) {
    return { stream, ...EMPTY_CURSOR };
  }
  const row = rows[0]!;
  return {
    stream,
    last_signature: row.last_signature,
    last_slot:      row.last_slot ? BigInt(row.last_slot) : 0n,
  };
}

export async function saveSvmCursor(
  pool: Pool,
  cursor: SvmCursor,
): Promise<void> {
  await pool.query(
    `INSERT INTO svm_indexer_cursor (stream, last_signature, last_slot, updated_at)
          VALUES ($1, $2, $3, NOW())
     ON CONFLICT (stream)
     DO UPDATE SET
          last_signature = EXCLUDED.last_signature,
          last_slot      = EXCLUDED.last_slot,
          updated_at     = NOW()`,
    [cursor.stream, cursor.last_signature, cursor.last_slot.toString()],
  );
}
