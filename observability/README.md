# Observability

What we monitor, where the dashboards live, and how alerts route.

## Stack

- **Logs** — pino JSON to stdout, ingested by Grafana Cloud Loki
  (or any OTel-compatible collector). Both `@modula/gateway` and
  `@modula/indexer` redact secrets at the log layer (see `log.ts`
  in each service).
- **Health checks** — both services expose `/healthz`. The
  indexer's response includes `chain_head`, `registry_cursor`, and
  `lag_blocks` so we can alert on indexer drift without scraping
  Postgres.
- **Dashboards** — JSON exports under `observability/grafana/`,
  importable via Dashboards → Import in Grafana Cloud or OSS.
- **Alerts** — defined in `observability/grafana/alerts.yaml` in
  Grafana's provisioning format. Three rules (see runbooks below).
- **Notification channel** — PagerDuty. Configure in Grafana →
  Alerting → Contact points; each rule routes to the on-call
  rotation.

## Quick setup

1. Create a Grafana Cloud workspace (free tier covers v1 traffic).
2. Add a Loki data source pointing at your log shipper (Vector,
   Promtail, or Grafana Cloud Agent).
3. Configure log forwarding from Fly + Railway to Loki:
   - Fly: `flyctl logs ship` or the Vector add-on.
   - Railway: built-in Grafana Cloud / Datadog / Better Stack
     drains.
4. Import the dashboards:
   - `Dashboards → Import` → upload
     `observability/grafana/indexer-dashboard.json`.
   - Same for `gateway-dashboard.json`.
5. Provision the alerts:
   - Either paste `alerts.yaml` into Grafana → Alerting → Alert
     rules → Import, or apply via Terraform / `grafanactl`.
6. Wire the PagerDuty contact point and route the three rules to
   it.

## Runbooks

Each alert links to a runbook so the on-call engineer has the
context up front. They live under `observability/runbooks/` and
are intentionally short — the steps you actually take, not theory.

| Alert | Runbook |
|-------|---------|
| Indexer lag > 30 blocks | [`runbooks/indexer-lag.md`](runbooks/indexer-lag.md) |
| Gateway 5xx > 1% over 5 min | [`runbooks/gateway-5xx.md`](runbooks/gateway-5xx.md) |
| Facilitator failure rate > 5% over 5 min | [`runbooks/facilitator-failure.md`](runbooks/facilitator-failure.md) |

## What we don't have yet

- **Prometheus `/metrics` endpoints** on gateway / indexer — v1 derives
  metrics from logs via Loki LogQL. When traffic outgrows that, add
  `prom-client` and wire panels off real time series.
- **Distributed tracing** — same story, deferred until we have a
  reason. The MCP `tools/call` chain has clear stages (verify →
  runtime → settle → log) that benefit from spans.
- **SLO definitions** — implicit today (indexer lag < 30s, gateway
  p95 < 500ms). Codify when we have a real user base.
