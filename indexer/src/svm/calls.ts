/**
 * Insert one row into svm_calls.
 *
 * Used by the SVM event-source poll loop after each newly-observed
 * SPL transfer to a known model treasury ATA. Idempotent on the
 * tx_signature primary key — re-poll runs that re-encounter the
 * same signature are no-ops.
 */
import type { Pool } from "pg";

export interface SvmCallRow {
  tx_signature: string;
  model_id:     Buffer;       // bytes32 model id (matches models.id)
  agent_pubkey: string;       // base58 payer
  paid_usdc:    string;       // exact 6-decimal string (e.g. "0.001000")
  network:      "solana" | "solana-devnet";
  slot:         bigint;
  latency_ms?:  number;
}

export async function recordSvmCall(
  pool: Pool,
  row: SvmCallRow,
): Promise<void> {
  await pool.query(
    `INSERT INTO svm_calls
        (tx_signature, model_id, agent_pubkey, paid_usdc,
         network, slot, latency_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (tx_signature) DO NOTHING`,
    [
      row.tx_signature,
      row.model_id,
      row.agent_pubkey,
      row.paid_usdc,
      row.network,
      row.slot.toString(),
      row.latency_ms ?? null,
    ],
  );
}
