-- 003_search.sql — full-text search on the models table
--
-- Adds a generated tsvector column across slug, base_model, and
-- manifest_description, backed by a GIN index. The API uses
-- plainto_tsquery() + ts_rank() for ranked full-text search on ?q=.
--
-- manifest_description is populated by the indexer when it indexes a
-- model registration event and resolves the manifest URI.

ALTER TABLE models ADD COLUMN IF NOT EXISTS manifest_description TEXT;

ALTER TABLE models ADD COLUMN IF NOT EXISTS
  search_vec TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(slug, '') || ' ' ||
      coalesce(base_model, '') || ' ' ||
      coalesce(manifest_description, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_models_search ON models USING GIN(search_vec);
