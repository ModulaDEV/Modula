<div align="center">

<img src="public/favicon.svg" width="88" alt="Modula" />

# Modula

### The tokenized AI model registry.

**Permissionless · On-chain · Agent-native · Built on Base**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-0052FF?style=for-the-badge&labelColor=0b1020)](./LICENSE)
[![Base](https://img.shields.io/badge/Deployed-Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white&labelColor=0b1020)](https://base.org)
[![ERC-7527](https://img.shields.io/badge/Standard-ERC--7527-0052FF?style=for-the-badge&labelColor=0b1020)](#erc-7527)
[![x402](https://img.shields.io/badge/Payments-x402-0052FF?style=for-the-badge&labelColor=0b1020)](#x402-pay-per-inference)
[![MCP](https://img.shields.io/badge/Agents-MCP-0052FF?style=for-the-badge&labelColor=0b1020)](#mcp-endpoint-per-model)
[![Year](https://img.shields.io/badge/Year-2026-0052FF?style=for-the-badge&labelColor=0b1020)](#)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-FF0055?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Status](https://img.shields.io/badge/Status-Live-22c55e?style=flat-square)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-0052FF?style=flat-square)](./CONTRIBUTING.md)

<br/>

[🌐 modula.base](https://modula.base) ·
[𝕏 @modulabase](https://x.com/modulabase) ·
[📄 Whitepaper](https://modula.base/whitepaper) ·
[🧭 Registry](https://modula.base/registry) ·
[📘 Docs](https://modula.base/docs)

</div>

---

## What is Modula?

**Modula is a permissionless, on-chain registry for AI models.**

Model creators register fine-tuned models — LoRAs, adapters, small
specialized models — directly on **Base** using **ERC-7527**. Every
registered model gets an **MCP endpoint** so any AI agent can call
it as a tool. Inference is paid per call in USDC through **x402**. A
bonding curve built into each model's token prices it by real agent
demand: the more usage, the more the token is worth.

> Think of it as a decentralized Hugging Face with built-in economics.
> Except the registry can't be censored, the payments can't be
> throttled, and the model's quality signal can't be faked.

Modula is **a protocol, not a product**. We don't take a cut. We
don't approve listings. We don't issue API keys.

---

## ✨ Why Modula

| | |
|---|---|
| 🔓 **Permissionless listing**     | Anyone can register a model on-chain. No approval, no form, no platform account. |
| 💠 **ERC-7527 bonding curves**    | Each model mints a token on a deterministic curve. Usage pushes price. |
| 🔌 **MCP-native endpoints**       | Every model is a drop-in tool any MCP agent can call without glue code. |
| ⚡ **x402 pay-per-inference**      | USDC settlement at request time. No API keys, no subscriptions. |
| 🏛 **0% protocol fee**             | 100% of inference revenue flows to the model's creator treasury. |
| 🧩 **Composable by design**        | Public on-chain objects. Any app, agent, or protocol can consume the registry. |

---

## 🏗 Architecture

```
┌─────────────┐   register    ┌───────────────────┐
│  Creator    │ ─────────────▶│    ERC-7527       │
│ (fine-tune) │               │ bonding curve +   │
└─────────────┘               │ model token       │
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
                              ┌───────────────────┐       x402         ┌──────────────┐
                              │   AI Agent (any)  │ ─────── $$ ───────▶│  Creator     │
                              │   Claude / Cursor │                    │  Treasury    │
                              │   custom / etc.   │                    │  (on Base)   │
                              └───────────────────┘                    └──────────────┘
```

The whole loop — register, index, discover, call, pay, settle — runs
on Base. No off-chain gatekeeper exists in the critical path.

---

## 🧱 Protocol components

### ERC-7527
A token standard that binds an asset to a deterministic bonding curve.
Each model on Modula is an ERC-7527 token, so its mint price is a
direct function of how much inference demand it has absorbed. **The
curve is the quality signal.**

### MCP Endpoint per model
Every registered model is served as a [Model Context Protocol](https://modelcontextprotocol.io)
tool. Agents discover it the same way they'd discover any MCP server,
call it with capability-specific input, and receive a structured
response — no custom SDK per model.

### x402 pay-per-inference
Requests carry their own payment signature over [x402](https://github.com/coinbase/x402).
The agent signs a USDC transfer + the request body in one round trip.
Modula's MCP layer gates the response on payment settlement, so the
call and the payment are atomically linked.

### Creator treasury
Each model has its own on-chain treasury controlled by the creator.
Inference revenue + bonding-curve proceeds land there directly. The
protocol address never holds inference revenue.

---

## 🎨 This repo — what's in it

This repository contains the **Modula landing site** (what you see
when you visit `modula.base`). The on-chain contracts, SDK, and MCP
server live in sibling repositories and ship under their own versions.

### Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5, strict mode
- **Animation**: Framer Motion 11
- **Fonts**: Inter + JetBrains Mono via `next/font`
- **Icons**: lucide-react
- **Deploy**: Vercel (edge for OG image)
- **Linting**: ESLint 9, flat config

### Structure

```
modula/
├── app/
│   ├── layout.tsx          root layout + metadata + ambient FX
│   ├── page.tsx            composes the nine home sections
│   ├── globals.css         design tokens + primitives
│   ├── robots.ts           programmatic robots.txt
│   ├── sitemap.ts          programmatic sitemap.xml
│   └── opengraph-image.tsx 1200×630 edge-rendered OG image
├── components/
│   ├── Nav.tsx             fixed scroll-reactive header
│   ├── Footer.tsx          multi-column footer w/ protocol strip
│   ├── Logo.tsx            gradient + mono logo mark
│   ├── Reveal.tsx          IntersectionObserver fade wrapper
│   ├── GlobalEffects.tsx   ambient grid + gradient + orbs
│   └── sections/
│       ├── Hero.tsx
│       ├── Stats.tsx
│       ├── HowItWorks.tsx
│       ├── Features.tsx
│       ├── Agents.tsx
│       ├── Economics.tsx   ← animated ERC-7527 SVG curve
│       ├── Registry.tsx    ← animated sparkline table
│       ├── Faq.tsx         ← motion accordion
│       └── CallToAction.tsx
├── data/                   content datasets (features, stats, models, faq)
├── site.config.ts          single source of truth for brand strings
├── public/                 favicon + static assets
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## 🚀 Quickstart

```bash
# clone
git clone https://github.com/ModulaDEV/Modula.git
cd modula

# install
npm install

# dev
npm run dev

# production build + serve
npm run build
npm run start

# typecheck + lint
npm run typecheck
npm run lint
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🚢 Deploying

The site is deployed to Vercel. To spin up your own fork:

```bash
npx vercel
# follow the prompts; link to your Vercel account
# then
npx vercel --prod
```

No environment variables are required — all content is static and
all protocol metadata lives in `site.config.ts`.

---

## 📐 Backend Architecture

The full design of what we are about to build — contracts, MCP gateway, x402 payment layer, indexer, runtime adapter, infrastructure, and the 50 / 50 sorrowz / powerz delivery plan — is a 38-page architecture document in this repo.

📄 **[Modula-Backend-Architecture.pdf](./docs/backend-architecture/Modula-Backend-Architecture.pdf)** — the rendered document
🧾 **[document.html](./docs/backend-architecture/document.html)** — the source
🔁 **[render.sh](./docs/backend-architecture/render.sh)** — headless-Chrome render script

Sections covered: executive summary · protocol overview · ERC-7527 / x402 / MCP primer · system architecture · contracts · gateway · x402 middleware · indexer · runtime · frontend wiring · infrastructure · workflow · file-by-file ownership · 10-week timeline · risks.

## 🧭 Roadmap

- [x] **Q1 2026** · Protocol whitepaper + landing site
- [x] **Q2 2026** · ERC-7527 reference implementation audited
- [x] **Q2 2026** · MCP server + x402 gateway, public testnet
- [ ] **Q3 2026** · Mainnet launch on Base, first 100 models indexed
- [ ] **Q3 2026** · Agent SDK (Claude / Cursor / custom) published
- [ ] **Q4 2026** · Registry indexer + analytics v1
- [ ] **Q4 2026** · Creator dashboard + on-chain treasury tooling
- [ ] **2027**    · Cross-rollup registry federation

---

## 🤝 Contributing

Pull requests and issues are welcome. Read
[CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow + commit style.

---

## 📜 License

[MIT](./LICENSE) © 2026 Modula Protocol

---

<div align="center">

**Register a model. Or build an agent that uses one.**

[🌐 modula.base](https://modula.base) · [𝕏 @modulabase](https://x.com/modulabase) · [📘 Docs](https://modula.base/docs)

<sub>Built with ❤️ on Base · 2026</sub>

</div>
