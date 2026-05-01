/**
 * Runtime health monitor — background job.
 *
 * Runs every 5 minutes. For each model that has a manifest_uri, fetches
 * the runtime URL declared in the manifest and marks the model "up" or
 * "down" in the database. On a "down" transition fires an optional
 * Telegram/webhook alert declared in the manifest as `alertWebhook`.
 *
 * Designed to run inside the indexer process — call `startHealthChecks`
 * once after the database is ready and wire the returned stopper into
 * the SIGTERM handler.
 */
import { Pool } from "pg";
import type { Logger } from "../log.js";

const CHECK_INTERVAL_MS = 5 * 60 * 1_000; // 5 minutes
const PING_TIMEOUT_MS   = 10_000;

interface ModelRow {
  id:            Buffer;
  manifest_uri:  string | null;
  health_status: "up" | "down" | null;
  alert_webhook: string | null;
}

interface Manifest {
  runtime?: { url?: string };
  alertWebhook?: string;
}

export function startHealthChecks(db: Pool, log: Logger): () => void {
  let stopped = false;

  const run = async () => {
    if (stopped) return;
    try {
      await runHealthChecks(db, log);
    } catch (err) {
      log.error({ err }, "health_check_run_failed");
    }
    if (!stopped) setTimeout(run, CHECK_INTERVAL_MS);
  };

  // Stagger first run by 30 s so indexer startup isn't impacted.
  const initial = setTimeout(run, 30_000);

  return () => {
    stopped = true;
    clearTimeout(initial);
  };
}

export async function runHealthChecks(db: Pool, log: Logger): Promise<void> {
  const { rows } = await db.query<ModelRow>(
    "SELECT id, manifest_uri, health_status, alert_webhook FROM models WHERE manifest_uri IS NOT NULL",
  );

  await Promise.allSettled(rows.map((m) => checkOne(db, log, m)));
}

async function checkOne(db: Pool, log: Logger, m: ModelRow): Promise<void> {
  if (!m.manifest_uri) return;

  const manifest = await fetchManifest(m.manifest_uri).catch(() => null);
  const runtimeUrl = manifest?.runtime?.url;
  if (!runtimeUrl) return;

  // Store the alert webhook from manifest if present and not yet saved.
  const alertWebhook = manifest?.alertWebhook ?? m.alert_webhook;

  const healthy = await ping(runtimeUrl);
  const prevStatus = m.health_status;

  await db.query(
    `UPDATE models
        SET health_status   = $2,
            last_healthy_at = CASE WHEN $2 = 'up' THEN NOW() ELSE last_healthy_at END,
            alert_webhook   = COALESCE($3, alert_webhook)
      WHERE id = $1`,
    [m.id, healthy ? "up" : "down", alertWebhook ?? null],
  );

  if (!healthy && prevStatus === "up") {
    log.warn({ manifest_uri: m.manifest_uri, runtimeUrl }, "model_runtime_down");
    if (alertWebhook) {
      await fireAlert(alertWebhook, runtimeUrl).catch((err) =>
        log.warn({ err, runtimeUrl }, "alert_webhook_failed"),
      );
    }
  }
}

async function ping(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function fetchManifest(uri: string): Promise<Manifest | null> {
  const url = uri.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${uri.slice(7)}`
    : uri;
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return (await res.json()) as Manifest;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fireAlert(webhookUrl: string, runtimeUrl: string): Promise<void> {
  await fetch(webhookUrl, {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body:    JSON.stringify({
      text: `🔴 Modula health alert: runtime ${runtimeUrl} is DOWN`,
    }),
  });
}
