# @modula/indexer

viem-driven event listener + Postgres store + read API for the Modula
protocol on Base.

## Responsibilities

1. **Tail on-chain events** — `ModelRegistered` from `ModulaRegistry`,
   `Wrap` / `Unwrap` from each per-model `ModulaAgency`, and
   `ModelCalled` from `ModulaAccessRouter`.
2. **Persist to Postgres** — `models`, `curve_ticks`, `calls` tables.
   Restart-safe via the `indexer_cursor` table.
3. **Serve the read API** — `/v1/models`, `/v1/models/:slug`,
   `/v1/models/:slug/ticks`, `/v1/stats`. Powers the frontend registry
   page and sparklines.

## Layout

```
indexer/
├─ migrations/         SQL migrations (node-pg-migrate)
│   ├─ 001_init.sql
│   └─ 002_cursor.sql
└─ src/
    ├─ db.ts           Postgres pool singleton
    ├─ client.ts       viem PublicClient
    ├─ listeners/      one file per event stream (registry, curve, access)
    ├─ api/            Hono REST routes
    └─ index.ts        process entry
```

## Local development

Requires Postgres 16 and a Base RPC (Anvil fork or Alchemy).

```bash
# from repo root
pnpm install

# bring up local Postgres + run migrations
docker run --name modula-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres pnpm --filter @modula/indexer migrate

# start the indexer (tails chain head, writes to DB)
pnpm --filter @modula/indexer dev
```

## Environment

See `.env.example` (added in a later commit). Required:

- `DATABASE_URL` — Postgres connection string
- `BASE_RPC` — JSON-RPC endpoint
- `CHAIN` — `base` or `baseSepolia`
- `START_BLOCK` — block to begin tailing from (defaults to current head)

Contract addresses are imported from `@modula/abi` and resolved by
`CHAIN`.

## Status

Early scaffold. See `feat/indexer` branch.
