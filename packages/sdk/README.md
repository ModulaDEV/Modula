# @modula/sdk

TypeScript client for the **Modula** protocol — discover, read, and
call on-chain AI models from your agent.

## Install

```bash
pnpm add @modula/sdk
# or: npm i @modula/sdk
```

Zero runtime dependencies — built on the platform's `fetch`. Works in
Node 18+, Bun, Deno, Cloudflare Workers, and the browser.

## Quick start

```ts
import { Modula, PaymentRequiredError } from "@modula/sdk";

const modula = new Modula({
  indexerUrl: "https://api.modulabase.org",
  gatewayUrl: "https://mcp.modulabase.org",
});

// Discover
const { items } = await modula.models.list({ type: "LoRA", limit: 10 });

// Inspect one
const model = await modula.models.get("solidity-audit-v3");

// Call (handle payment manually for v0.1)
try {
  const result = await modula.gateway.callTool(
    model.agency,
    "solidity_audit_v3",
    { source: "contract Foo { ... }" },
  );
  console.log(result.content[0]?.text);
} catch (err) {
  if (err instanceof PaymentRequiredError) {
    // 402 Payment Required — sign EIP-3009 over the requirements,
    // then retry with `paymentSignature` set on options.
    // Auto-signing with a viem WalletClient lands in v0.2.
  }
  throw err;
}
```

## API surface

### `new Modula(options)`

| Option       | Type                 | Required | Default               |
|--------------|----------------------|----------|-----------------------|
| `indexerUrl` | `string`             | ✓        | —                     |
| `gatewayUrl` | `string`             | ✓        | —                     |
| `bearer`     | `string`             |          | (none)                |
| `fetch`      | `typeof fetch`       |          | `globalThis.fetch`    |

### `modula.models` — read API

- `list(opts)` — paginated, filterable model list
- `get(slug)` — full record + recent ticks + recent calls
- `listTicks(slug, opts)` — time-series for charts (supports `since` cursor)
- `getStats()` — protocol-wide counters

### `modula.gateway` — MCP + x402

- `listTools(agency)` — anonymous discovery, returns the model's MCP tool descriptors
- `callTool(agency, name, args, opts?)` — MCP `tools/call`. Throws
  `PaymentRequiredError` if the gateway returns 402; pass
  `opts.paymentSignature` to retry with a pre-signed EIP-3009 authorization.
- `callToolWithAutoPay(agency, name, args, signer, opts?)` — same as
  above but auto-signs the EIP-3009 challenge with a viem-compatible
  signer.
- `streamTool(agency, name, args, signer, opts?)` — SSE streaming;
  yields one string per `data:` event from the model runtime.
- `callToolSvmWithAutoPay(agency, name, args, signer, buildTransfer, opts?)`
  — Solana settlement variant. Posts to `/m/:agency/mcp/svm`, signs
  an SPL Token-2022 transfer through the provided builder + signer.

### `modula.call*` — top-level conveniences

- `modula.call(slug, toolName, args, signer)` — discover model by
  slug, call it, auto-pay on Base.
- `modula.stream(slug, toolName, args, signer)` — same as `call` but
  yields SSE chunks.
- `modula.callSvm(slug, toolName, args, signer, buildTransfer)` —
  Solana-rail one-liner. The `signer` is an `SvmSigner`
  (`{ publicKey, signTransaction }`) and `buildTransfer` constructs
  the SPL transfer (typically imported from `@modula/sdk-solana`).

## Solana support

The SDK can settle payments on either Base or Solana. The Base path
is fully built into `@moduladev/sdk` (this package). The Solana path
needs a transfer builder — the SDK does not import `@solana/web3.js`
directly to keep the EVM-only bundle small.

```ts
import { Modula, type SvmSigner, type SvmTransferBuilder } from "@moduladev/sdk";

// 1. Wrap your Solana wallet in the SvmSigner shape:
const signer: SvmSigner = {
  publicKey: walletAdapter.publicKey.toBase58(),
  signTransaction: async (txBase64) => {
    /* deserialize, .sign(), serialize back to base64 */
  },
};

// 2. Provide an SPL transfer builder (default ships in @modula/sdk-solana):
const buildTransfer: SvmTransferBuilder = async ({ payer, payTo, mint, amount, network }) => {
  /* build a Token-2022 transferChecked tx, return base64 */
};

// 3. Call any model — the SDK handles the 402 → sign → retry loop:
const result = await modula.callSvm(
  "solidity-audit-v3",
  "audit",
  { src: "..." },
  signer,
  buildTransfer,
);
```

Two tokens, one protocol — see [SOLANA.md](../../SOLANA.md) at the
repo root for the full architecture.

## Roadmap

- **v0.3** — typed tool calls generated from each model's `inputSchema`
  (so `modula.tools["solidity-audit-v3"].call({ source: ... })` is fully typed).
- **v0.4** — `@modula/sdk-solana` ships the default `SvmTransferBuilder`
  so Solana users don't have to write one by hand.

## License

MIT.
