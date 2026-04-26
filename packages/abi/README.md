# `@modula/abi`

TypeScript-friendly ABI exports for the Modula on-chain protocol.

## What it ships

| Export | What it is |
| --- | --- |
| `modulaRegistryAbi`     | Global registry of every model on Modula. |
| `modulaFactoryAbi`      | Single entry point creators call to register. |
| `modulaAgencyAbi`       | Per-model bonding-curve engine (hot read surface). |
| `modulaAppAbi`          | Per-model ERC-721 token (Modula additions only). |
| `modulaAccessRouterAbi` | Gateway-signed inference logger. |
| `erc20Abi`              | Standard ERC-20 subset (USDC reads). |
| `ADDRESSES`             | Per-chain canonical contract addresses. |

Every ABI is exported as a `readonly` `as const` array so `viem`,
`wagmi`, and `abitype` produce maximally-precise call types out of
the box.

## Install

```bash
npm install @modula/abi viem
```

## Usage

```ts
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { modulaAgencyAbi, ADDRESSES } from "@modula/abi";

const client = createPublicClient({ chain: base, transport: http() });

// Quote the next mint along a model's bonding curve.
const [premium, fee] = await client.readContract({
  address: "0x4a7f...b12c",
  abi: modulaAgencyAbi,
  functionName: "getWrapOracle",
  args: ["0x"],
});
```

## Subpath exports

Each ABI is also importable directly for the tightest possible bundle:

```ts
import { modulaAgencyAbi } from "@modula/abi/agency";
import { erc20Abi }        from "@modula/abi/erc20";
import { ADDRESSES }       from "@modula/abi/addresses";
```

## Versioning

The ABI matches a specific deployed contract suite. Whenever a new
mainnet deploy lands, the package's minor version is bumped and the
addresses block in `addresses.ts` is updated. Patch versions are
docs-only changes.

## Maintenance

Each `src/<name>.ts` file mirrors the matching contract in
`contracts/src/<Name>.sol`. Drift between the two is a bug — open an
issue and the ABI file will be re-curated by hand. We deliberately do
not auto-regenerate from `forge inspect` because the hand-curated ABI
is shorter (no internal helpers, no override resolutions), and a
typed-array form survives Solidity refactors better than a JSON dump.
