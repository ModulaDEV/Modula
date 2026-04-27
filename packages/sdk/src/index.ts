/**
 * @modula/sdk — TypeScript client for the Modula protocol.
 *
 *   import { Modula } from "@modula/sdk";
 *
 *   const modula = new Modula({
 *     indexerUrl: "https://api.modulabase.org",
 *     gatewayUrl: "https://mcp.modulabase.org",
 *   });
 *
 *   // Discover
 *   const { items } = await modula.models.list({ type: "LoRA", limit: 10 });
 *
 *   // Inspect one
 *   const model = await modula.models.get("solidity-audit-v3");
 *
 *   // Call (handle payment manually for v0.1)
 *   try {
 *     const result = await modula.gateway.callTool(
 *       model.agency,
 *       "solidity_audit_v3",
 *       { source: "..." },
 *     );
 *   } catch (err) {
 *     if (err instanceof PaymentRequiredError) {
 *       // sign the EIP-3009 authorization and retry with paymentSignature
 *     } else throw err;
 *   }
 */
import { RegistryClient } from "./registry.js";
import { GatewayClient }  from "./gateway.js";

export interface ModulaOptions {
  /** URL of @modula/indexer (read API). */
  indexerUrl: string;
  /** URL of @modula/gateway (MCP + x402). */
  gatewayUrl: string;
  /** Optional bearer token for gateway calls (when OAUTH_ENABLED). */
  bearer?:    string;
  /** Custom fetch (for testing, edge runtimes, etc.). */
  fetch?:     typeof fetch;
}

export class Modula {
  readonly models:  RegistryClient;
  readonly gateway: GatewayClient;

  constructor(opts: ModulaOptions) {
    this.models = new RegistryClient({
      baseUrl: opts.indexerUrl,
      fetch:   opts.fetch,
    });
    this.gateway = new GatewayClient({
      baseUrl: opts.gatewayUrl,
      bearer:  opts.bearer,
      fetch:   opts.fetch,
    });
  }

  /** Convenience alias for stats. */
  stats() {
    return this.models.getStats();
  }
}

export { RegistryClient, GatewayClient };
export * from "./types.js";
