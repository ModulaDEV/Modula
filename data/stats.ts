export type Stat = {
  k: string;
  line: string;
  sub: string;
};

export const STATS: readonly Stat[] = [
  {
    k: "0%",
    line: "Protocol fee on inference",
    sub: "Creators keep 100% of what agents pay per call.",
  },
  {
    k: "ERC-7527",
    line: "Bonding-curve standard",
    sub: "Price discovery encoded directly into the model token.",
  },
  {
    k: "MCP",
    line: "Agent-native endpoints",
    sub: "Every listed model is a tool any MCP agent can call.",
  },
  {
    k: "x402",
    line: "USDC settlement rail",
    sub: "Requests carry payment — no keys, no accounts, no billing.",
  },
];
