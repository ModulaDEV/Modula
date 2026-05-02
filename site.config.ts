export const siteConfig = {
  name: "Modula",
  tagline: "The tokenized AI model registry.",
  description:
    "Modula is a permissionless protocol on Base that lets model creators register fine-tuned AI models on-chain. Each model exposes an MCP endpoint so agents can call it as a tool. Pay-per-inference settles through x402, and a bonding curve on ERC-7527 prices model quality by real agent demand. Expanding to Solana — one protocol, two settlement layers.",
  shortDescription:
    "Permissionless AI model registry. On-chain. Agent-native. Built on @Base, expanding to @Solana.",

  url: "https://www.modulabase.org",
  twitter: "https://x.com/modulabase",
  twitterHandle: "@modulabase",
  telegram: "https://t.me/modulabase",
  githubUrl: "https://github.com/ModulaDEV/Modula",
  docsPath: "/docs",
  registryPath: "/registry",
  tokenPath: "/token",
  whitepaperPath: "/whitepaper",

  buyUrl: "https://dexscreener.com/base/modula",
  baseExplorerUrl:
    "https://basescan.org/address/0x49E1Ed74bcaDd4EDF38520EC8330391b9E745F52",

  chain: "Base",
  secondaryChain: "Solana",
  standard: "ERC-7527",
  paymentRail: "x402",
  agentInterface: "MCP",

  launchYear: 2026,
} as const;

export type SiteConfig = typeof siteConfig;
