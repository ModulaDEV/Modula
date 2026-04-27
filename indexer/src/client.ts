/**
 * viem PublicClient for the indexer.
 *
 * Read-only — the indexer never writes to chain. Construction mirrors
 * @modula/gateway's createClients but drops the WalletClient branch.
 *
 * Multicall batching is enabled for the read API (it batches small
 * registry record / agency-quote reads), but the listener loop uses
 * watchContractEvent / getLogs directly and isn't affected.
 */
import { createPublicClient, http, type PublicClient } from "viem";
import { base, baseSepolia } from "viem/chains";

import type { Config } from "./config.js";

const chains = { base, baseSepolia };

export function createClient(config: Config): PublicClient {
  const chain = chains[config.CHAIN];
  if (!chain) throw new Error(`unknown chain: ${config.CHAIN}`);

  return createPublicClient({
    chain,
    transport: http(config.BASE_RPC_URL, {
      retryCount: 3,
      retryDelay: 250,
      timeout:    8_000,
    }),
    batch: { multicall: { batchSize: 1024, wait: 16 } },
  }) as PublicClient;
}
