# Modula Contracts

Solidity 0.8.24 contracts that implement the on-chain half of the
Modula protocol on Base.

## What's in here

| Contract | Role |
| --- | --- |
| [`ModulaRegistry`](./src/ModulaRegistry.sol)         | Global on-chain index of every registered model. |
| [`ModulaFactory`](./src/ModulaFactory.sol)           | Deploys a paired (Agency, App) per model via EIP-1167 clones. |
| [`ModulaAgency`](./src/ModulaAgency.sol)             | ERC-7527 Agency · holds USDC reserve · prices the bonding curve. |
| [`ModulaApp`](./src/ModulaApp.sol)                   | ERC-7527 App · ERC-721 · one NFT per unit of curve supply. |
| [`ModulaAccessRouter`](./src/ModulaAccessRouter.sol) | Gateway-signed event emitter for off-chain analytics. |

## Standards used

- **[ERC-7527](https://eips.ethereum.org/EIPS/eip-7527)** — Token Bound Function Oracle AMM.
  `ModulaAgency` and `ModulaApp` implement the paired Agency / App interfaces.
- **[ERC-721](https://eips.ethereum.org/EIPS/eip-721)** — `ModulaApp` is an ERC-721.
- **[ERC-20](https://eips.ethereum.org/EIPS/eip-20)** — USDC is the reserve currency for every Agency.
- **[EIP-1167](https://eips.ethereum.org/EIPS/eip-1167)** — `ModulaFactory` uses minimal proxy clones to keep
  per-model deploy cost under \$3 on Base mainnet.
- **[EIP-3009](https://eips.ethereum.org/EIPS/eip-3009)** — USDC's transferWithAuthorization, used by the off-chain
  x402 layer. Not consumed by the contracts directly.

## Local setup

```bash
# install Foundry (if you don't have it)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# install dependencies
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install Vectorized/solady --no-commit

# build
forge build

# unit tests
forge test -vv

# invariant tests
forge test --match-contract Invariant -vv

# coverage (excludes script/ + test/)
forge coverage --no-match-coverage 'script/|test/'
```

## Deployment

See [`script/Deploy.s.sol`](./script/Deploy.s.sol) and the runbook in
[`script/README.md`](./script/README.md).

```bash
# Base Sepolia
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify

# Base mainnet (uses hardware wallet — no PK in env)
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify --ledger
```

## Layout

```
contracts/
├── foundry.toml          Foundry config (0.8.24, via-ir, profiles)
├── remappings.txt        Library import aliases
├── src/
│   ├── interfaces/       External-facing interfaces
│   ├── libraries/        Pure helpers (bonding curve math, errors, events)
│   ├── ModulaRegistry.sol
│   ├── ModulaFactory.sol
│   ├── ModulaAgency.sol
│   ├── ModulaApp.sol
│   └── ModulaAccessRouter.sol
├── test/                 Foundry tests · forge test
└── script/               Deployment + ops scripts
```

## Audit posture

All contracts are in scope for a single comprehensive external audit
before mainnet. Individual contract files include NatSpec tagging
audit-relevant invariants with `@custom:invariant`. Use
`grep -rn '@custom:invariant' src/` to enumerate them.
