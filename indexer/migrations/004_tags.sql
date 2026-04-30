-- 004_tags.sql — model tags junction table
--
-- Creators declare free-form tags in manifest JSON ("tags": ["vision", "finance"]).
-- The gateway writes them here on manifest fetch. The API filters via ?tag=.

CREATE TABLE IF NOT EXISTS model_tags (
  model_id BYTEA  NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  tag      TEXT   NOT NULL,
  PRIMARY KEY (model_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_model_tags_tag ON model_tags(tag);
