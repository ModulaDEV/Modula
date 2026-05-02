# Solana Expansion

> **Base is home. Solana is expansion. Adding, not migrating.**

This document describes Modula's Solana expansion: what stays on Base, what
gets built on Solana, and how the two settlement layers work together
under one protocol.

---

## TL;DR

- The Modula protocol launched on **Base** and is **expanding to Solana**.
- Core contracts, the model registry, the SDK, and the **$MODULA** token
  remain on Base. **Nothing on Base changes.**
- A **separate Solana-native token** ships on Solana with its own utility
  for Solana-settled inference. **Two tokens, one protocol, both with
  real utility.**
- Models registered once on Base are callable from agents on **either
  chain** through the gateway.
- The SDK surface is identical for callers — pass a Solana wallet to
  `modula.call()` instead of a viem wallet client.

---

## What stays on Base

| Component | Status |
| --- | --- |
| ERC-7527 bonding-curve contracts (Registry, Factory, Agency, App) | **Stays on Base.** Mainnet, unchanged. |
| Model registry (canonical source of truth) | **Stays on Base.** All models register here. |
| `@modula/sdk` package | **Stays.** Adds a Solana adapter, no breaking change. |
| `@modula/abi` package | **Stays.** Solidity ABIs only. |
| `$MODULA` protocol token | **Stays.** Same address, same supply, same holder discount. |
| Indexer + read API | **Stays.** Indexes Base events; will gain a Solana event source. |
| Gateway (MCP + x402) | **Stays.** Adds a Solana settlement path. |

If you hold $MODULA on Base today, **nothing about your position
changes.** The Solana expansion does not dilute, replace, or migrate it.

---

## What gets built on Solana

| Component | Description |
| --- | --- |
| **x402 settlement on Solana** | Agents on Solana pay inference in USDC over SVM. The x402 facilitator already supports Solana — we wire the gateway to a second facilitator endpoint. |
| **Solana SDK adapter** | A new `@modula/sdk-solana` package (or a sub-export of `@modula/sdk`) that wraps the existing client with Solana wallet support. The caller-facing surface (`modula.call(slug, args, wallet)`) stays the same. |
| **Cross-chain model discovery** | Models registered on Base are visible to Solana agents. The registry remains canonical on Base; the Solana-side resolver reads from the indexer's `/v1/models` endpoint. |
| **Solana-native token** | A separate Solana token with its own holder-discount utility on Solana-settled inference calls. Launches on PumpFun. **Not bridged. Not wrapped. Not $MODULA.** |
| **wXRP integration** *(future)* | wXRP launched on Solana, providing an XRP-ecosystem entry point without a separate XRPL deployment. Built after Solana foundation is stable. |

---

## Token architecture — two tokens, one protocol

This is the most important section to read before tweeting, posting, or
explaining the expansion to anyone.

### $MODULA on Base
- The **protocol token**.
- Holder-discount on **every inference call** through the gateway:
  ≥1,000 = 10% off, ≥10,000 = 20% off.
- Gateway reads `balanceOf(wallet)` at challenge-time. No staking, no
  claiming, no opt-in.
- **Unchanged by the Solana expansion.** Same address. Same supply. Same
  utility. Same holders.

### Solana token
- **Separate**. Not the same contract. Not the same supply. Not bridged
  from Base. Not wrapped.
- Launches on **PumpFun** — fair launch, no VC allocation, no presale,
  no insider advantage. Permissionless, like the protocol.
- Holds its own holder-discount utility for **Solana-settled inference
  calls** (mirrors the Base discount for the Solana payment path).
- **Solana-native community token**, framed as "a Solana-native access
  point for the Modulabase ecosystem."

### What this is NOT
- ❌ A bridge token.
- ❌ A wrapped $MODULA.
- ❌ A migration off Base.
- ❌ A replacement for $MODULA.
- ❌ A second issuance of the protocol token.

### What this IS
- ✅ A second, independent Solana-native token with its own utility.
- ✅ One protocol with two settlement layers and two ecosystem tokens.
- ✅ Additive — both sides benefit from increased agent volume through
  the protocol.

---

## How a Solana agent calls a Base-registered model

```
┌────────────────┐    discover (read API)    ┌────────────────┐
│ Solana agent   │ ────────────────────────▶ │ @modula/indexer │
└────────┬───────┘                            └────────────────┘
         │ tools/call (MCP, JSON-RPC)
         ▼
┌────────────────┐  402 Payment Required     ┌────────────────┐
│ @modula/gateway│ ───────────────────────▶  │ Solana wallet   │
└────────┬───────┘  signed Solana USDC tx    └────────┬───────┘
         │ ◀────────────────────────────────────────────
         │ verify w/ Solana x402 facilitator
         │ proxy to model runtime (manifest.runtime.url)
         ▼
┌────────────────┐
│ Model runtime  │ ── output ──▶ back to gateway ──▶ back to agent
└────────────────┘
```

Key point: the **model itself never moves**. Registration, treasury, and
bonding-curve state all live on Base. The Solana side only handles the
agent's payment.

---

## SDK usage — same surface, two wallets

### Base (today)
```ts
import { Modula } from "@modula/sdk";
import { createWalletClient, http } from "viem";

const modula = new Modula({
  indexerUrl: "https://api.modulabase.org",
  gatewayUrl: "https://mcp.modulabase.org",
});

const wallet = createWalletClient({ /* Base / EVM */ });
const result = await modula.call("solidity-audit-v3", "audit", { src }, wallet);
```

### Solana (post-expansion)
```ts
import { Modula } from "@modula/sdk";
import { Keypair } from "@solana/web3.js";

const modula = new Modula({
  indexerUrl: "https://api.modulabase.org",
  gatewayUrl: "https://mcp.modulabase.org",
});

const wallet = /* Solana Keypair or wallet adapter */;
const result = await modula.call("solidity-audit-v3", "audit", { src }, wallet);
```

The model slug, the tool name, and the args are **identical**. Only the
wallet object differs. The SDK detects which payment rail to use from
the wallet shape.

---

## Multi-chain philosophy

Modula does not expand to chains for the sake of it. Every chain added
must satisfy:

1. **Real agent activity** that benefits from Modula infrastructure.
2. **Existing infrastructure** that connects to the stack — x402 support,
   USDC availability, sub-second-ish finality.

Current strategy:
- **Base** — Home. Core contracts. Protocol token. All development
  continues here.
- **Solana** — Expansion. Speed, agent ecosystem, x402-native, wXRP
  bridge target.
- **Additional chains** — Evaluated case by case. Not announced, not
  promised.

---

## Status

| Item | Status |
| --- | --- |
| Base contracts on mainnet | ✅ Live (v1.0.0) |
| Indexer + gateway on Base | ✅ Live |
| `@modula/sdk` with auto-pay, streaming, pipelines | ✅ Shipped |
| `$MODULA` on Base + holder discount | ✅ Live |
| Frontend messaging for dual-chain | 🟡 In progress |
| Solana SDK adapter | ⏳ Planned |
| Solana x402 settlement path on gateway | ⏳ Planned |
| Solana-native token launch (PumpFun) | ⏳ Days out |
| wXRP integration | ⏳ After Solana foundation is stable |

---

## Common questions

**Is the Solana token the same as $MODULA on Base?**
No. Two separate tokens. $MODULA on Base is the protocol token,
unchanged. The Solana token is a Solana-native community token with its
own utility.

**Does expanding to Solana dilute Base $MODULA holders?**
No. Base $MODULA is unchanged — same supply, same holder discount, same
address. The Solana expansion drives more total volume through the
protocol, which strengthens both sides.

**Are you abandoning Base?**
No. Base is home. Core contracts and the protocol token stay on Base. All
future development continues on Base. Solana is additive.

**Why PumpFun for the Solana token?**
Fair launch. No VC allocation, no presale, no insider advantage —
permissionless, like the protocol itself.

**What about wXRP?**
wXRP on Solana gives Modula access to the XRP ecosystem without a
separate XRPL deployment. We will build the integration once the Solana
foundation is stable. No specific timeline.

**Aren't you spreading resources thin?**
The SDK works on both chains with zero code changes for the caller. x402
already supports both chains natively. The gateway routes automatically.
This is one protocol with two exits, not two products.

---

*Base is home. Solana is expansion. One protocol. Two settlement
layers.*
