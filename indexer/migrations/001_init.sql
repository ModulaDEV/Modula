-- 001_init.sql
-- Initial schema for the Modula indexer.
--
-- Three tables, one per event stream we tail:
--   models      <- ModulaRegistry.ModelRegistered
--   curve_ticks <- ModulaAgency.Wrap | Unwrap (one row per event)
--   calls       <- ModulaAccessRouter.ModelCalled
--
-- Identity rules
--   models.id is keccak256(slug) so it matches what the registry emits.
--   All address / hash columns are stored as bytea (20 / 32 bytes raw)
--   to avoid the 0x... text comparison footguns and to keep on-chain
--   payloads round-trippable.
--   USDC amounts are numeric(38,6) — wide enough for any realistic
--   premium, exact at USDC's 6-decimal precision.

CREATE TABLE models (
  id            bytea        PRIMARY KEY,
  slug          text         NOT NULL UNIQUE,
  agency        bytea        NOT NULL UNIQUE,
  app           bytea        NOT NULL UNIQUE,
  creator       bytea        NOT NULL,
  treasury      bytea        NOT NULL,
  base_model    text,
  model_type    text,
  manifest_uri  text,
  registered_at timestamptz  NOT NULL,
  registered_tx bytea        NOT NULL
);

CREATE INDEX models_creator_idx  ON models (creator);
CREATE INDEX models_type_idx     ON models (model_type);
CREATE INDEX models_registered_at_idx ON models (registered_at DESC);

CREATE TABLE curve_ticks (
  model_id     bytea          NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  block_number bigint         NOT NULL,
  tx_hash      bytea          NOT NULL,
  kind         text           NOT NULL CHECK (kind IN ('wrap','unwrap')),
  supply_after bigint         NOT NULL,
  price_usdc   numeric(38,6)  NOT NULL,
  ts           timestamptz    NOT NULL,
  PRIMARY KEY (model_id, block_number, tx_hash)
);

CREATE INDEX curve_ticks_model_ts_idx ON curve_ticks (model_id, ts DESC);

CREATE TABLE calls (
  tx_hash    bytea         PRIMARY KEY,
  model_id   bytea         NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  agent      bytea         NOT NULL,
  paid_usdc  numeric(38,6) NOT NULL,
  latency_ms int           NOT NULL,
  ts         timestamptz   NOT NULL
);

CREATE INDEX calls_model_ts_idx ON calls (model_id, ts DESC);
CREATE INDEX calls_agent_idx    ON calls (agent);
