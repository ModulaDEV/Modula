/**
 * viem client factories.
 *
 * The gateway reads chain state heavily and writes only to AccessRouter.
 * We construct a public read client lazily per chain and a wallet
 * client only when a private key is configured (write paths are
 * optional for read-only deployments).
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia }   from "viem/chains";

import type { Config } from "../config.js";
import { ConfigError } from "../errors.js";

const chains = { base, baseSepolia };

export interface Clients {
  read:  PublicClient;
  write: WalletClient | null;
  signerAddress: `0x${string}` | null;
}

export function createClients(config: Config): Clients {
  const chain = chains[config.CHAIN];
  if (!chain) throw new ConfigError(`unknown chain: ${config.CHAIN}`);

  const read = createPublicClient({
    chain,
    transport: http(config.BASE_RPC_URL, {
      retryCount: 3,
      retryDelay: 250,
      timeout: 8_000,
    }),
    batch: { multicall: { batchSize: 1024, wait: 16 } },
  });

  let write: WalletClient | null = null;
  let signerAddress: `0x${string}` | null = null;
  if (config.GATEWAY_SIGNER_PRIVATE_KEY) {
    const account = privateKeyToAccount(
      config.GATEWAY_SIGNER_PRIVATE_KEY as `0x${string}`,
    );
    write = createWalletClient({
      account,
      chain,
      transport: http(config.BASE_RPC_URL),
    });
    signerAddress = account.address;
  }

  return {
    read:  read as PublicClient,
    write: write as WalletClient | null,
    signerAddress,
  };
}
