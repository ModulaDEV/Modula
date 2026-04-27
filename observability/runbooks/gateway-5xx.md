# Runbook — Gateway 5xx rate > 1%

**Severity:** critical · **Service:** `@modula/gateway`

## Why this fires

5xx responses from the gateway over a 5-minute window exceed 1% of
all requests. At our scale, this means agents calling tools are
hitting failures.

## Triage in order

1. **Open the gateway dashboard** — look at the "Recent gateway
   errors" panel. The error message points at the subsystem.

2. **Categorize by subsystem** by grepping the recent errors:

   | Pattern in logs                | Subsystem        | See              |
   |--------------------------------|------------------|------------------|
   | `upstream runtime ...`         | model runtime    | step 3           |
   | `x402_(verify|settle)_failed`  | facilitator      | facilitator runbook |
   | `chain_read_failed`            | Base RPC         | indexer runbook  |
   | `oauth_jwks_fetch_failed`      | OAuth issuer     | step 4           |
   | otherwise                      | gateway code     | step 5           |

3. **Runtime upstreams** — a creator-hosted endpoint is failing.
   Identify the model: `model.slug` is in the error context. Open
   the model record on `/registry/[slug]` and look at the manifest
   `runtime.url`. If many models from the same host are failing,
   that host is degraded — there's nothing we can do, the gateway
   already returns 502 with the upstream code (no payment captured
   for failed inference).

4. **OAuth issuer down** — Clerk / Auth0 outage. Check their status
   page. If sustained, temporarily set `OAUTH_ENABLED=false` in
   Fly secrets and `flyctl deploy` to bypass. Tools/list still
   works; tools/call will accept anonymous payments until OAuth
   recovers.

5. **Gateway code regression** — recent deploy. Check `flyctl
   releases list` for the most recent deploy; if 5xx started right
   after, `flyctl releases rollback` to the previous version.

## Mitigations

- **Multi-region failover** is automatic — if `iad` fails, traffic
  routes to `ord` and `fra`. No action needed.
- **Cold-start spikes** show up briefly in 5xx; the alert window
  (5 min) absorbs them. If you see a brief spike that already
  resolved, no action.

## Don't do

- Don't restart Fly machines individually — Fly's autoscaler does
  that. `flyctl scale count` only when you have a sustained
  capacity problem.
