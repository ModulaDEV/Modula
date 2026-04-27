# Modula — local development

This guide gets the full stack — site, gateway, indexer, contracts,
Postgres, Anvil — running on your laptop in under five minutes.

## Prerequisites

- Node 22 + pnpm 10 (`corepack enable` if pnpm isn't installed).
- Docker (any recent version with Compose v2).
- Foundry — only needed if you want to redeploy contracts locally
  (`curl -L https://foundry.paradigm.xyz | bash && foundryup`).

## One-command stack

```bash
# 1. Bring up Postgres + Anvil (Postgres auto-runs indexer migrations)
docker compose up -d

# 2. Install + build the workspace
pnpm install
pnpm --filter @modula/abi build

# 3. (Optional) Deploy the protocol contracts to local Anvil
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --unlocked \
  --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266   # Anvil default
cd ..

# 4. Run the off-chain services (in three terminals)
pnpm --filter @modula/indexer dev    # tails Anvil → writes to Postgres
pnpm --filter @modula/gateway dev    # MCP + x402 on :8787
pnpm dev                             # Next.js site on :3000
```

The site at `http://localhost:3000/registry` reads from
`http://localhost:8788` by default. Override with
`INDEXER_URL=http://...` in `.env.local`.

## Service ports

| Service        | Port  | Health     |
|----------------|-------|------------|
| Site (Next.js) | 3000  | —          |
| Gateway (Hono) | 8787  | `/healthz` |
| Indexer API    | 8788  | `/healthz` |
| Postgres       | 5432  | `pg_isready` |
| Anvil RPC      | 8545  | `eth_blockNumber` |

## Environment

Each service has its own `.env.example`. Copy to `.env` (gitignored)
and fill in real values.

| Service  | File                  | Required vars |
|----------|-----------------------|----------------|
| Site     | `.env.example`        | `INDEXER_URL` |
| Gateway  | `gateway/.env.example` | `BASE_RPC_URL`, `X402_FACILITATOR_URL`, `X402_FACILITATOR_API_KEY`, `GATEWAY_SIGNER_PRIVATE_KEY` |
| Indexer  | `indexer/.env.example` | `DATABASE_URL`, `BASE_RPC_URL`, `CHAIN` |
| Contracts| `contracts/.env.example` | `BASE_SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `BASESCAN_API_KEY` |

For local dev against the Compose stack, sane defaults are:

```bash
# .env.local at repo root (consumed by Next.js)
INDEXER_URL=http://localhost:8788

# indexer/.env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/modula
BASE_RPC_URL=http://localhost:8545
CHAIN=baseSepolia
START_BLOCK=0

# gateway/.env
BASE_RPC_URL=http://localhost:8545
CHAIN=baseSepolia
X402_FACILITATOR_URL=https://api.cdp.coinbase.com/x402
X402_FACILITATOR_API_KEY=devkey
GATEWAY_SIGNER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

The `GATEWAY_SIGNER_PRIVATE_KEY` above is the canonical Anvil
account #0 — fine for local, never use on mainnet.

## Common workflows

**Reset everything** (drop pg data + restart Anvil):
```bash
docker compose down -v && docker compose up -d
```

**Tail indexer lag**:
```bash
curl -s localhost:8788/healthz | jq
```

**Run the gateway test suite**:
```bash
pnpm --filter @modula/gateway test
```

**Run all typecheckers**:
```bash
pnpm --filter @modula/abi build && pnpm -r typecheck
```

**Smoke-test the read API**:
```bash
curl -s localhost:8788/v1/models | jq '.items | length'
curl -s localhost:8788/v1/stats  | jq
```

## Troubleshooting

**Port 5432 already in use** — local Postgres or another container
is bound. `docker compose down` or change the host port mapping.

**Anvil `eth_chainId` returns 31337 not 8453** — `docker-compose.yml`
sets `--chain-id 8453` to match Base mainnet so address derivations
match. If you see 31337, you're hitting a different anvil; check
`docker ps`.

**Indexer logs `pg_pool_error`** — Postgres isn't ready yet. The
healthcheck retries; if it's persistent, `docker compose logs
postgres` should show why.

**Site renders mock data** — that's expected when the indexer is
unreachable. Confirm `pnpm --filter @modula/indexer dev` is running
and `localhost:8788/healthz` returns 200.

## Production parity

- **Postgres** in dev = Supabase in prod. Same `numeric(38,6)` math,
  same `bytea` storage. Port from local to Supabase by changing
  `DATABASE_URL`.
- **Anvil** in dev = Base Sepolia / mainnet in prod. Set
  `CHAIN=baseSepolia` and `BASE_RPC_URL` to your Alchemy endpoint.
- **Gateway** in dev = Fly.io in prod. `gateway/Dockerfile` is the
  same in both. Run locally with `docker build -f gateway/Dockerfile
  -t modula-gateway . && docker run -p 8787:8787 modula-gateway`.
- **Indexer** in dev = Railway in prod. Same story — `indexer/Dockerfile`
  is portable.
