export type FaqItem = {
  q: string;
  a: string;
};

export const FAQ: readonly FaqItem[] = [
  {
    q: "What is Modula in one sentence?",
    a: "A permissionless, on-chain registry where creators publish fine-tuned AI models that any agent can discover and call through MCP, with inference settled in USDC over x402 and a bonding curve on ERC-7527 pricing every model by real demand.",
  },
  {
    q: "Why does this need to be on-chain?",
    a: "So the registry can't be censored, the payments can't be throttled, and the price signal on each model can't be manufactured. Putting the registry, the settlement, and the demand curve on Base means Modula is a protocol, not a platform — nobody needs permission to list, read, or pay.",
  },
  {
    q: "What kind of models belong on Modula?",
    a: "Fine-tunes — LoRAs, adapters, small specialized models, domain experts — the long tail that the centralized hubs do not price well. If a model is useful to agents as a callable tool, it belongs on Modula.",
  },
  {
    q: "How does the bonding curve work?",
    a: "Each model has its own ERC-7527 token minted on a deterministic curve. Inference usage buys into the curve, which increases the mint price. The curve is the model's live quality signal: the more agents route to it, the more its token is worth.",
  },
  {
    q: "What is MCP and why does Modula use it?",
    a: "MCP is the Model Context Protocol — an open standard for exposing a callable tool to an AI agent. Modula generates an MCP endpoint for every registered model, so any MCP-aware agent (Claude, Cursor, custom agents) can add a Modula model as a tool in one line.",
  },
  {
    q: "How is inference paid for?",
    a: "Over x402 — an HTTP-native payment rail that settles in USDC on Base. A calling agent signs the request and the payment in the same round trip. No API keys, no subscriptions, no manual top-ups.",
  },
  {
    q: "Does Modula take a cut?",
    a: "No. The protocol takes 0% of inference revenue. 100% of what an agent pays flows directly to the model's on-chain treasury, controlled by the creator. The protocol earns nothing from usage.",
  },
  {
    q: "Is the code open source?",
    a: "Yes. Modula is released under the MIT license and every contract and SDK is published on GitHub. Read, fork, audit, and self-host anything you want.",
  },
  {
    q: "Why are you expanding to Solana?",
    a: "Two reasons. First, x402 already supports USDC settlement on Solana natively — this is extending existing infrastructure, not rebuilding it. Second, Solana has sub-second finality and fraction-of-a-cent fees, which matter when an agent is calling models thousands of times a day. Base is home. Solana is expansion. Adding, not migrating.",
  },
  {
    q: "Is the Solana token the same as $MODULA on Base?",
    a: "No. They are two separate tokens. $MODULA on Base is the protocol token — unchanged, unaffected, still the same address and the same holder discount. The Solana token is a separate Solana-native token with its own utility on Solana-settled inference. Two tokens, one protocol, both with real utility.",
  },
  {
    q: "Are you abandoning Base?",
    a: "No. Base is home. Core contracts, the model registry, the SDK, and $MODULA all stay on Base. All future development continues on Base. Solana is additive — one protocol with two settlement layers, not two competing products.",
  },
  {
    q: "Does the Solana expansion dilute Base $MODULA holders?",
    a: "No. Base $MODULA is unchanged — same supply, same holder discount, same address. The Solana expansion drives more total volume through the protocol, which strengthens both sides. Models registered on Base earn from agents on both chains.",
  },
];
