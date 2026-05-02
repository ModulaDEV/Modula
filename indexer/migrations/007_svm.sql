-- Solana settlement event store.
--
-- Mirrors the EVM `calls` table for SVM-paid inference calls. Stored
-- separately rather than UNIONed in because:
--   * tx hashes are different shapes (base58 vs 0x hex)
--   * settlement amounts use different facilitator metadata
--   * agent identity is a base58 pubkey, not a 20-byte EVM address
--
-- Cross-rail aggregations (revenue per model across both rails) are
-- done in the API serializers via two cheap queries; keeping the
-- tables apart avoids polluting the EVM hot path.

CREATE TABLE IF NOT EXISTS svm_calls (
  -- Solana tx signature (base58, 64-bit-encoded 64-byte ed25519).
  -- Length 87..88 chars; not pinned to allow future variant lengths.
  tx_signature  TEXT        PRIMARY KEY,

  -- Modula model the call was paid to.
  model_id      BYTEA       NOT NULL REFERENCES models(id) ON DELETE CASCADE,

  -- Base58 payer pubkey (the agent's wallet on Solana).
  agent_pubkey  TEXT        NOT NULL,

  -- USDC paid in 6-decimal base units (matches Base USDC).
  paid_usdc     NUMERIC(38, 6) NOT NULL,

  -- Cluster the settlement happened on.
  network       TEXT        NOT NULL CHECK (network IN ('solana', 'solana-devnet')),

  -- Solana slot at which the tx was confirmed.
  slot          BIGINT      NOT NULL,

  -- Timestamp the indexer observed the tx (closest available proxy
  -- for "when the call happened" — Solana's blockTime is best-effort).
  ts            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional latency from the gateway's settle path (ms).
  latency_ms    INT
);

CREATE INDEX IF NOT EXISTS idx_svm_calls_model      ON svm_calls (model_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_svm_calls_agent      ON svm_calls (agent_pubkey, ts DESC);
CREATE INDEX IF NOT EXISTS idx_svm_calls_network_ts ON svm_calls (network, ts DESC);

-- Indexer cursor for SVM event streams. One row per stream
-- (e.g. "USDCTransfer" for treasury ATA transfers).
CREATE TABLE IF NOT EXISTS svm_indexer_cursor (
  stream          TEXT        PRIMARY KEY,
  last_signature  TEXT,
  last_slot       BIGINT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
