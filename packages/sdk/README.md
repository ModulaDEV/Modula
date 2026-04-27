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

## Roadmap

- **v0.2** — built-in EIP-3009 signing via an optional viem `WalletClient`,
  so `callTool` auto-pays without the manual retry dance.
- **v0.3** — typed tool calls generated from each model's `inputSchema`
  (so `modula.tools["solidity-audit-v3"].call({ source: ... })` is fully typed).

## License

MIT.
