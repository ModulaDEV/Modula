# Deploy + Ops Scripts

Foundry scripts for the on-chain side of Modula. All run via
`forge script <path> --rpc-url <chain> --broadcast`.

## Scripts

| Script | Who runs it | What it does |
| --- | --- | --- |
| [`Deploy.s.sol`](./Deploy.s.sol)                       | Protocol team, once per chain | Deploys the full suite (App + Agency impls, Registry, Factory, AccessRouter). |
| [`CreateModel.s.sol`](./CreateModel.s.sol)             | Any creator                   | Registers one model on a deployed Factory. |
| [`SetGatewaySigner.s.sol`](./SetGatewaySigner.s.sol)   | Protocol multisig only        | Rotates the gateway hot-wallet signer on AccessRouter. |

## Deploy runbook (mainnet)

This is the canonical sequence for cutting a new mainnet deployment.
Each step is a separate transaction so any failure can be retried without
re-doing earlier steps.

### Pre-flight

1. **Audit sign-off**. The contracts must be at the audited tag.
   Mainnet deploys never run from a feature branch.
2. **Multisig ready**. The protocol owner is a Safe with at least three
   signers. Confirm signer roster before broadcasting.
3. **Hardware wallet attached**. Mainnet deploys use `--ledger` —
   the deployer key never lives in env on mainnet.
4. **Etherscan key in env**. `BASESCAN_API_KEY` must be set so
   `--verify` succeeds in the same broadcast.

### Step 1 — Deploy core suite

```bash
PROTOCOL_OWNER=0x...   # Safe address
GATEWAY_SIGNER=0x...   # Hot wallet rotated frequently

forge script script/Deploy.s.sol \
  --rpc-url base \
  --broadcast \
  --verify \
  --ledger \
  --sender $LEDGER_ADDRESS
```

Capture the printed addresses into the public registry config.

### Step 2 — Smoke-test

Register a single throwaway model via `CreateModel.s.sol` and confirm:

- The factory emits `ModelDeployed` on-chain.
- The registry record is fetchable via `cast call <registry> "records(bytes32)" <id>`.
- The MCP gateway can resolve the model's manifest and serve `tools/list`.

### Step 3 — Publish addresses

Push the addresses to:

- `site.config.ts` on the public site (PR + redeploy).
- The indexer's `.env` (Railway secrets).
- The gateway's `.env` (Fly secrets).

### Step 4 — Hand off ownership

If the deployer EOA is not already the AccessRouter owner, transfer
ownership to the multisig **immediately**:

```bash
ROUTER=0x... NEW_OWNER=0x... \
  forge script script/TransferOwnership.s.sol --rpc-url base --broadcast --ledger
```

(Future task: implement TransferOwnership.s.sol when needed.)

## Rotation runbook (gateway signer)

Use this when the hot-wallet key is rotated or compromised.

1. Generate a new EOA in the gateway's secret manager.
2. Multisig signs a `setGatewaySigner` tx via `SetGatewaySigner.s.sol`.
3. Update `GATEWAY_SIGNER_PRIVATE_KEY` in the gateway's deploy env.
4. Restart the gateway.
5. Indexer notes the `GatewaySignerRotated` event and starts trusting
   `ModelCalled` events from the new signer at the rotation block onwards.

## Verification

Every script broadcast writes a `broadcast/` directory with the full tx
trace. Commit only the `run-latest.json` files for production deploys
under `broadcast/<chainId>/run-<timestamp>.json` — they document
which contract addresses correspond to which audited tag.
