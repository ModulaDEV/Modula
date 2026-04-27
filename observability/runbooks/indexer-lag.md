# Runbook — Indexer lag > 30 blocks

**Severity:** warning · **Service:** `@modula/indexer`

## Why this fires

The indexer's `/healthz` reports `lag_blocks = chain_head -
registry_cursor`. We alert when that exceeds 30 blocks (~60s on Base)
for 5 minutes straight.

Sustained lag means the read API is serving stale data — registry
list, sparklines, and call counts on the site lag behind on-chain
reality.

## Triage in order

1. **Open the indexer dashboard in Grafana** — check the "Listener
   tick errors" panel. If errors are spiking, the listener is failing,
   not just slow.

2. **Check the indexer logs**:

   ```
   {service="modula-indexer"} | json | level=`error`
   ```

   Common signatures:

   - `pg_pool_error` — Postgres unreachable. Hop to Supabase status,
     check `DATABASE_URL` is still valid (rotated key?).
   - `listener_tick_failed` with `cause: "fetch failed"` — Base RPC
     is degraded. Check Alchemy dashboard.
   - `manifest_fetch_failed` — IPFS gateway slow; not blocking but
     noisy. Lower priority.

3. **Check Base RPC status** — open Alchemy dashboard, look at
   `eth_getLogs` latency. If RPC is the bottleneck, lag will recover
   on its own once RPC clears, but that may be hours.

4. **Restart the indexer service if all else looks fine.** Railway:
   `Service → Restart`. The cursor is durable; restart picks up
   exactly where it left off.

## Mitigations

- If RPC is the bottleneck and recovery is slow, switch
  `BASE_RPC_URL` to a backup provider (QuickNode, Ankr) via Railway
  env vars — no code change needed.
- If a single listener stream is stuck, the others keep running.
  The frontend gracefully renders partial data.

## Don't do

- Don't manually rewind `indexer_cursor.last_block` unless you're
  sure events were missed — moving it backwards causes re-ingestion
  (idempotent, but wastes RPC quota).
