-- Add runtime health tracking columns to models.
-- health_status: 'up' | 'down' | NULL (not yet checked)
-- last_healthy_at: last time the runtime responded 2xx
-- alert_webhook: optional Telegram/webhook URL from the manifest's alertWebhook field

ALTER TABLE models
  ADD COLUMN IF NOT EXISTS health_status    TEXT        CHECK (health_status IN ('up','down')),
  ADD COLUMN IF NOT EXISTS last_healthy_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS alert_webhook    TEXT;

CREATE INDEX IF NOT EXISTS idx_models_health ON models (health_status)
  WHERE health_status IS NOT NULL;
