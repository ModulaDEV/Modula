# Testing

How to run the test suites that ship with this monorepo.

## Per-package commands

| Package           | Command                          | Coverage |
| ----------------- | -------------------------------- | -------- |
| `gateway`         | `cd gateway && pnpm test`         | 67 tests across 9 files (`vitest`) |
| `packages/sdk`    | `cd packages/sdk && pnpm test`    | 17 tests across 2 files (`vitest`) |
| `indexer`         | `cd indexer && pnpm test`         | requires Docker for `testcontainers/postgresql` (real Postgres) |
| `packages/abi`    | `cd packages/abi && pnpm test`    | typecheck only |

The full workspace can be tested with `pnpm -r test` from the repo root.
The indexer suite will fail on systems without Docker — that is expected
and not a regression. Skip it locally with `pnpm -r --filter '!@modula/indexer' test`.

## SVM (Solana) test coverage

The Solana settlement path has 36 dedicated tests today:

| Module                                       | Tests | Notes |
| -------------------------------------------- | ----- | ----- |
| `gateway/src/svm/pubkey.test.ts`             | 12    | base58 pubkey shape validator |
| `gateway/src/svm/codec.test.ts`              | 11    | `decodeSvmPayload` + rejection paths |
| `gateway/src/svm/cluster.test.ts`            | 7     | mint + RPC URL lookups |
| `gateway/src/svm/amount.test.ts`             | 12    | USDC base-unit conversion |
| `gateway/src/svm/middleware.test.ts`         | 3     | non-payment passthrough + 402 challenge encode |
| `gateway/src/routes/healthz.test.ts`         | 5     | settlement mount status field |
| `packages/sdk/src/svm-amount.test.ts`        | 11    | SDK USDC base-unit helpers |
| `packages/sdk/src/svm-autopay.test.ts`       | 6     | `svmSignPayment` round-trip + `svmDecodeRequirements` |
| `indexer/src/svm/poll.test.ts`               | 4     | poll loop control flow with stubbed RPC |
| `indexer/src/api/decimal.test.ts`            | 8     | exact 6-decimal `sumUsdc` |

Total: **79 SVM-related tests**, all green on `main`.

## What is *not* yet covered

- End-to-end signed transaction round-trip against a local
  validator — needs a `solana-test-validator` integration suite
  (planned, not blocking the scaffolding).
- Real SVM x402 facilitator integration (`/verify` + `/settle`) —
  needs a deployed facilitator endpoint.
- Real `SvmRpcClient` implementation — currently stubbed; the
  `@solana/web3.js`-backed client lands when `SVM_ENABLED=true`
  in production.

## CI

GitHub Actions runs `pnpm -r test` per workspace package on every push.
Indexer tests run inside the action runner (Docker available); local
clones without Docker should rely on CI for those.

The CI workflow at `.github/workflows/services.yml` runs:

- `services / abi · typecheck + build`
- `services / sdk · typecheck + build`
- `services / site · typecheck + build`
- `services / configs · lint dashboards + alerts`
- `services / gateway · typecheck + test`
- `services / indexer · typecheck + test`
