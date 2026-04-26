<div align="center">

<img src="https://raw.githubusercontent.com/ModulaDEV/Modula/main/public/modula-logo.jpg" width="120" alt="Modula" style="border-radius: 24px;" />

<br/><br/>

# Modula

### *The tokenized AI model registry.*

**Permissionless · On-chain · Agent-native · Built on [@Base](https://base.org)**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-0052FF?style=for-the-badge&labelColor=0b1020)](./LICENSE)
[![Built on Base](https://img.shields.io/badge/Built_on-Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white&labelColor=0b1020)](https://base.org)
[![ERC-7527](https://img.shields.io/badge/Standard-ERC--7527-0052FF?style=for-the-badge&labelColor=0b1020)](https://eips.ethereum.org/EIPS/eip-7527)
[![x402](https://img.shields.io/badge/Payments-x402-0052FF?style=for-the-badge&labelColor=0b1020)](https://www.x402.org/)
[![MCP](https://img.shields.io/badge/Agents-MCP-0052FF?style=for-the-badge&labelColor=0b1020)](https://modelcontextprotocol.io)

<br/>

[![Status](https://img.shields.io/badge/Status-Live-22c55e?style=flat-square)](https://www.modulabase.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-0052FF?style=flat-square)](./CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code_of_Conduct-2.1-blueviolet?style=flat-square)](./CODE_OF_CONDUCT.md)
[![Security](https://img.shields.io/badge/Security-Policy-red?style=flat-square)](./SECURITY.md)

<br/>

### [🌐 modulabase.org](https://www.modulabase.org) · [𝕏 @modulabase](https://x.com/modulabase) · [📄 Whitepaper](https://www.modulabase.org/whitepaper) · [🧭 Registry](https://www.modulabase.org/registry) · [📘 Docs](https://www.modulabase.org/docs)

</div>

---

## What is Modula?

> A permissionless, on-chain registry for fine-tuned AI models —
> with built-in economics.

Modula is a protocol on **Base**. Model creators register fine-tuned models
(LoRAs, adapters, small specialized models) directly on-chain through
**ERC-7527**. Each registered model gets a deterministic **MCP endpoint** so
any AI agent can call it as a tool. Inference is paid per call in USDC over
**x402**, and a bonding curve built into every model token prices it by real
agent demand.

Think of it as a decentralized Hugging Face — except the registry can't be
censored, the payments can't be throttled, and the model's quality signal
can't be faked.

> **Modula is a protocol, not a product.**
> We don't take a cut. We don't approve listings. We don't issue API keys.

---

## ✨ Core principles

|  |  |
|---|---|
| 🔓 **Permissionless** | Anyone can register a model on-chain. No approval, no application, no platform account. |
| 💠 **Tokenized**      | Each model mints a token on a deterministic ERC-7527 bonding curve. |
| 🔌 **Agent-native**   | Every model is an MCP tool any AI agent can drop-in call. |
| ⚡ **Pay-per-call**    | x402 settles inference in USDC at request time. No keys, no subscriptions. |
| 🏛 **0% protocol fee** | 100% of inference revenue flows to the model's creator treasury. |
| 🧩 **Composable**     | Public on-chain objects. Any app, agent, or protocol can read the registry. |

---

## 🏗 How it works

```
┌─────────────┐    register     ┌───────────────────┐
│  Creator    │ ───────────────▶│    ERC-7527       │
│ (fine-tune) │                 │ bonding curve +   │
└─────────────┘                 │ model token       │
                                └──────────┬────────┘
                                           │ emits
                                           ▼
                                ┌───────────────────┐
                                │  Modula Registry  │
                                │  (on-chain index) │
                                └──────────┬────────┘
                                           │ exposes
                                           ▼
                                ┌───────────────────┐
                                │   MCP Endpoint    │
                                │  per-model tool   │
                                └──────────┬────────┘
                                           │ called by
                                           ▼
                                ┌───────────────────┐         x402         ┌──────────────┐
                                │   AI Agent (any)  │ ──────── $$ ────────▶│  Creator     │
                                │   Claude / Cursor │                      │  Treasury    │
                                │   custom / etc.   │                      │  (on Base)   │
                                └───────────────────┘                      └──────────────┘
```

Every step — register, index, discover, call, pay, settle — runs on Base.
There is no off-chain gatekeeper in the critical path.

---

## 📡 The four standards Modula sits on

### [Base](https://base.org)
Coinbase's L2. Cheap gas, fast finality, the canonical chain for x402
settlement. Modula deploys here.

### [ERC-7527](https://eips.ethereum.org/EIPS/eip-7527)
The Token Bound Function Oracle AMM standard. Each Modula model is an
ERC-7527 pair (Agency + App): the Agency holds the reserve and prices
mint/burn along a bonding curve; the App is the model's token. The curve
is the model's live, on-chain quality signal.

### [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
Open JSON-RPC standard for exposing tools to LLM hosts. Modula generates
a deterministic MCP endpoint for every registered model so any
MCP-aware client (Claude, Cursor, custom agents) can add a Modula model
as a tool in one line.

### [x402](https://www.x402.org/)
HTTP-native payments. The agent signs an EIP-3009 USDC authorization
inside the request itself; the server gates the response on settlement.
No API keys, no subscriptions, no manual top-ups.

---

## 🌐 This repository

This is the **public, open-source** repository for the Modula landing
site at [modulabase.org](https://www.modulabase.org).

### Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5, strict mode
- **Animation**: Framer Motion 11
- **Fonts**: Inter + JetBrains Mono via `next/font`
- **Icons**: lucide-react
- **Linting**: ESLint 9, flat config

### Structure

```
modula/
├─ app/                   App Router routes + layout + globals.css
│  ├─ docs/
│  ├─ registry/
│  ├─ whitepaper/
│  ├─ opengraph-image.tsx
│  ├─ robots.ts
│  └─ sitemap.ts
├─ components/            Shared + section components
│  └─ sections/           Hero · Stats · HowItWorks · Features ·
│                         Agents · Economics · Registry · Faq · CTA
├─ data/                  Content datasets (typed, readonly)
├─ public/                Static assets
└─ site.config.ts         Single source of truth for brand strings
```

---

## 🚀 Getting started

```bash
git clone https://github.com/ModulaDEV/Modula.git
cd Modula
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev`        | Next.js dev server with hot reload |
| `npm run dev:turbo`  | Dev server with Turbopack |
| `npm run build`      | Production build |
| `npm run start`      | Serve the production build |
| `npm run typecheck`  | Run `tsc --noEmit` |
| `npm run lint`       | Run ESLint over the project |

No environment variables are required to run the site locally — content is
static and protocol metadata lives in [`site.config.ts`](./site.config.ts).

---

## 🤝 Contributing

Modula is open source under the MIT license. PRs and issues are welcome.

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow + commit style.
- Read the [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.
- Found a security issue? Read [SECURITY.md](./SECURITY.md) — please
  disclose responsibly.

---

## 🔐 Security

We take security seriously. If you've found a vulnerability, please **do
not** open a public issue. Read our [security policy](./SECURITY.md) and
contact us privately at **security@modulabase.org**.

---

## 📜 License

[MIT](./LICENSE) © 2026 Modula

---

<div align="center">

### **Register a model. Or build an agent that uses one.**

[🌐 modulabase.org](https://www.modulabase.org) · [𝕏 @modulabase](https://x.com/modulabase) · [📘 Docs](https://www.modulabase.org/docs)

<sub>Built on [@Base](https://base.org) · 2026</sub>

</div>
