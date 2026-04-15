import {
  Boxes,
  Coins,
  Network,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";

export type Feature = {
  title: string;
  body: string;
  Icon: typeof Boxes;
};

export const FEATURES: readonly Feature[] = [
  {
    title: "Permissionless listing",
    body: "Any creator can register a fine-tuned model on-chain. No gatekeeper, no application form, no platform approval — deploy once and it is discoverable forever.",
    Icon: Boxes,
  },
  {
    title: "ERC-7527 bonding curves",
    body: "Each model mints a token on a deterministic bonding curve. As agents call the model, demand pushes price — the curve itself becomes a live signal of model quality.",
    Icon: Coins,
  },
  {
    title: "MCP-native endpoints",
    body: "Every registered model exposes a Model Context Protocol endpoint so any MCP-aware agent can discover it, negotiate inputs, and call it as a tool without glue code.",
    Icon: Network,
  },
  {
    title: "x402 pay-per-inference",
    body: "Inference is settled in USDC over the x402 payment rail. No API keys, no subscriptions, no manual top-ups — the request itself carries the payment.",
    Icon: Zap,
  },
  {
    title: "Zero middleman take rate",
    body: "Modula takes 0% of inference revenue. Payments flow directly from the calling agent to the model's on-chain treasury. The protocol earns nothing from usage.",
    Icon: ShieldCheck,
  },
  {
    title: "Composable by design",
    body: "Models are public on-chain objects. Agents can chain them, other protocols can wrap them, and any app can surface the registry — the data is not locked to one UI.",
    Icon: Workflow,
  },
];
