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
];
