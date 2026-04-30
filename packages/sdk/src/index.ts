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
 *   // One-liner call with auto-pay (signs EIP-3009 USDC on 402):
 *   const result = await modula.call(
 *     "solidity-audit-v3",
 *     "solidity_audit_v3",
 *     { source: "..." },
 *     viemWalletClient,
 *   );
 */
import { RegistryClient } from "./registry.js";
import { GatewayClient }  from "./gateway.js";
import { type AutoPaySigner } from "./autopay.js";
import { getOrCreateWallet, clearWallet, fundFromFaucet, type WalletOptions } from "./wallet.js";

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

  /** Browser-only wallet utilities — generates + persists a local signer. */
  readonly wallet = {
    /**
     * Returns a stable AutoPaySigner for this browser session.
     * Generates a random private key on first call and stores it in
     * localStorage under "modula:wallet". Rehydrates on subsequent calls.
     */
    create: (opts?: WalletOptions) => getOrCreateWallet(opts),
    /** Wipe the stored key. Next create() call generates a fresh one. */
    clear:  () => clearWallet(),
    /**
     * Fund the address with testnet USDC via the Circle faucet.
     * Only works on Base Sepolia — call once after wallet.create({ chain: "baseSepolia" }).
     */
    fund:   (address: `0x${string}`) => fundFromFaucet(address),
  } as const;

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

  /**
   * Discover a model by slug, call one of its tools, and auto-pay the
   * 402 USDC challenge — all in one await.
   *
   * @param slug      Registry slug, e.g. "solidity-audit-v3"
   * @param toolName  MCP tool name exposed by that model
   * @param args      Tool arguments
   * @param signer    viem WalletClient or any { address, signTypedData }
   */
  async call(
    slug: string,
    toolName: string,
    args: unknown,
    signer: AutoPaySigner,
  ) {
    const model = await this.models.get(slug);
    return this.gateway.callToolWithAutoPay(
      model.agency,
      toolName,
      args,
      signer,
    );
  }
}

export { RegistryClient, GatewayClient };
export * from "./types.js";
export * from "./autopay.js";
export * from "./wallet.js";
export * from "./pipeline.js";
