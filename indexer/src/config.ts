/**
 * Typed env loader for the indexer.
 *
 * Same shape as @modula/gateway's config — zod-validated at boot,
 * crashes on a missing or malformed value. The indexer is read-only
 * on chain (no signer) so the gateway's signer fields are absent.
 */
import { z }         from "zod";
import { ADDRESSES } from "@modula/abi";
import type { ChainKey } from "@modula/abi";

const Hex = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, "must be a 0x-prefixed hex string");

const HexAddress = Hex.refine(
  (s) => s.length === 42,
  "must be a 20-byte address (0x + 40 hex chars)",
);

const Schema = z.object({
  PORT:  z.coerce.number().int().min(1).max(65_535).default(8788),
  HOST:  z.string().default("0.0.0.0"),

  CHAIN:        z.enum(["base", "baseSepolia"]).default("base"),
  BASE_RPC_URL: z.string().url(),

  // Optional overrides for local Anvil where ADDRESSES are zero.
  REGISTRY_ADDRESS:      HexAddress.optional(),
  ACCESS_ROUTER_ADDRESS: HexAddress.optional(),

  DATABASE_URL:           z.string().url(),
  DATABASE_POOL_MAX:      z.coerce.number().int().min(1).max(64).default(10),

  // Block to begin tailing from when the cursor for a stream is 0.
  // Defaults to 0 (i.e. genesis) — production should set this to the
  // deployment block of the registry to avoid scanning unnecessary range.
  START_BLOCK: z.coerce.bigint().default(0n),

  // Polling interval for the listener loop.
  POLL_INTERVAL_MS: z.coerce.number().int().min(250).default(2_000),

  // Block confirmations to wait before ingesting. Base reorgs are rare
  // but possible pre-finality; raise this on production for safety.
  CONFIRMATIONS: z.coerce.number().int().min(0).default(0),

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

type Raw = z.infer<typeof Schema>;

export interface Config extends Raw {
  /** Resolved per-chain canonical addresses with env overrides applied. */
  addresses: {
    chainId:      number;
    name:         string;
    usdc:         `0x${string}`;
    registry:     `0x${string}`;
    factory:      `0x${string}`;
    accessRouter: `0x${string}`;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed   = Schema.parse(env);
  const chainKey = parsed.CHAIN as ChainKey;
  const onchain  = ADDRESSES[chainKey];

  return {
    ...parsed,
    addresses: {
      chainId:  onchain.chainId,
      name:     onchain.name,
      usdc:     onchain.usdc as `0x${string}`,
      registry: (parsed.REGISTRY_ADDRESS ?? onchain.registry) as `0x${string}`,
      factory:  onchain.factory as `0x${string}`,
      accessRouter:
        (parsed.ACCESS_ROUTER_ADDRESS ?? onchain.accessRouter) as `0x${string}`,
    },
  };
}
