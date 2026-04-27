-- 002_cursor.sql
-- Restart-safe replay cursor.
--
-- One row per event stream we listen on. On boot the indexer reads
-- the last_block per stream and resumes watchContractEvent from
-- last_block + 1, so a crash or redeploy never silently drops events.
--
-- We key by event_name (text) rather than (chain_id, contract_addr,
-- event_name) because v1 indexes a single chain's registry / router.
-- When we go multi-chain, add chain_id and reseed.

CREATE TABLE indexer_cursor (
  event_name text        PRIMARY KEY,
  last_block bigint      NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed rows so UPDATE-only writes are safe in the listener loop.
-- last_block = 0 means "tail from the deployment block of the contract"
-- (the listener reads the deployment block from @modula/abi/addresses).
INSERT INTO indexer_cursor (event_name, last_block) VALUES
  ('ModelRegistered', 0),
  ('Wrap',            0),
  ('Unwrap',          0),
  ('ModelCalled',     0);
