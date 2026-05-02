# `@modula/gateway`

The MCP gateway. Stateless TypeScript service that exposes one Model
Context Protocol endpoint per Modula model and gates paid calls
through the x402 payment rail.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`  | `/healthz/live`             | Liveness probe. |
| `GET`  | `/healthz/ready`            | Readiness probe. |
| `GET`  | `/m/:agency/manifest.json`  | Public manifest read for a model. |
| `POST` | `/m/:agency/mcp`            | MCP JSON-RPC over EVM x402 (Base settlement). |
| `POST` | `/m/:agency/mcp/svm`        | MCP JSON-RPC over SVM x402 (Solana settlement). Mounted only when `SVM_ENABLED=true`. |

## Request lifecycle (paid `tools/call`)

```
Agent ─POST tools/call──▶ Gateway
                          │
        Gateway ─readModel┐
                          ├─quoteWrap (cached)
                          ▼
        Gateway ──402 + PAYMENT-REQUIRED
   ◀──────────────────────┘
   Agent signs EIP-3009 transferWithAuthorization
                          │
   Agent ─retry + PAYMENT-SIGNATURE─▶ Gateway
                          │
                          ├─facilitator.verify()
                          ├─run handler / proxy to runtime
                          ├─facilitator.settle() → tx hash
                          ├─AccessRouter.log() (queued microtask)
                          ▼
        Gateway ──200 + tool result + PAYMENT-RESPONSE
   ◀──────────────────────┘
```

## Stack

- **Hono 4** — HTTP framework, sub-ms routing on Node 22
- **viem 2** — chain reads and `gatewaySigner` writes
- **pino 9** — structured logging with secret redaction
- **zod 3** — env + payload validation
- **@modula/abi** — local workspace package with the typed ABIs

## Local dev

```bash
cp .env.example .env       # then fill in BASE_RPC_URL, facilitator key, etc.
npm install
npm run dev                # tsx watch on src/server.ts
```

The dev server binds `0.0.0.0:8787` by default. With `NODE_ENV` unset,
logs are pretty-printed.

```bash
# unit tests
npm run test

# typecheck
npm run typecheck

# production build
npm run build && npm run start
```

## Deployment

Deployed to Fly.io in three regions (`iad`, `ord`, `fra`) with the
Coinbase x402 facilitator behind it. The `Dockerfile` builds a static
ESM bundle into a distroless image; rolling deploys use Fly's blue-green
strategy with a 10-second SIGTERM grace window matching the in-process
shutdown handler.

A read-only configuration is supported (no `GATEWAY_SIGNER_PRIVATE_KEY`
in env) for development environments — the gateway will serve every
read path but skip writes to `AccessRouter` with a warn log line.

## Source layout

```
gateway/src/
├── server.ts              entry — config + log + listen + signals
├── app.ts                 Hono factory, mounts every route
├── config.ts              zod-validated env loader
├── log.ts                 pino logger + secret redaction
├── errors.ts              GatewayError taxonomy
├── chain/
│   ├── clients.ts         viem PublicClient + WalletClient
│   ├── cache.ts           TtlCache<K, V>
│   ├── registry.ts        readModelByAgency / readModelBySlug
│   ├── agency.ts          quoteWrap / quoteUnwrap / readAsset
│   └── access.ts          logAccess (writes ModelCalled)
├── x402/
│   ├── types.ts           wire types (PaymentRequirements etc.)
│   ├── codec.ts           base64-JSON encode + decode
│   ├── facilitator.ts     /verify + /settle HTTP client
│   └── middleware.ts      EVM challenge → verify → next → settle
├── svm/                   SVM (Solana) x402 settlement path
│   ├── constants.ts       USDC mints, RPC URLs, commitment level
│   ├── pubkey.ts          base58 pubkey shape validator
│   ├── codec.ts           decodeSvmPayload from PAYMENT-SIGNATURE
│   ├── cluster.ts         usdcMintFor, defaultRpcUrlFor
│   ├── amount.ts          to/from USDC base units
│   ├── errors.ts          WrongRecipient, WrongAmount, StaleBlockhash, …
│   ├── facilitator.ts     SvmFacilitatorClient
│   ├── middleware.ts      SVM challenge → verify → next → settle
│   └── index.ts           public barrel
└── routes/
    ├── healthz.ts         liveness + readiness + settlement mount status
    ├── manifest.ts        public manifest read
    ├── mcp.ts             JSON-RPC 2.0 surface, EVM-paid
    └── mcp-svm.ts         JSON-RPC 2.0 surface, SVM-paid
```

## Security

See the top-level [`SECURITY.md`](../SECURITY.md). Do not open public
issues for vulnerabilities; email **security@modulabase.org**.
