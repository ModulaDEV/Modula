/**
 * Typed env loader for the gateway.
 *
 * Every entry is validated by a zod schema at process start. Failure
 * crashes the process with a precise message — we never run with a
 * half-configured environment.
 */
import { z }          from "zod";
import { ADDRESSES }  from "@modula/abi";
import type { ChainKey } from "@modula/abi";

const Hex = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, "must be a 0x-prefixed hex string");

const HexAddress = Hex.refine(
  (s) => s.length === 42,
  "must be a 20-byte address (0x + 40 hex chars)",
);

const PrivateKey = Hex.refine(
  (s) => s.length === 66,
  "must be a 32-byte private key (0x + 64 hex chars)",
);

const Schema = z.object({
  PORT:  z.coerce.number().int().min(1).max(65_535).default(8787),
  HOST:  z.string().default("0.0.0.0"),

  CHAIN:        z.enum(["base", "baseSepolia"]).default("base"),
  BASE_RPC_URL: z.string().url(),

  REGISTRY_ADDRESS:      HexAddress.optional(),
  ACCESS_ROUTER_ADDRESS: HexAddress.optional(),

  GATEWAY_SIGNER_PRIVATE_KEY: PrivateKey.optional(),

  X402_FACILITATOR_URL:     z.string().url(),
  X402_FACILITATOR_API_KEY: z.string().min(1),

  // --- OAuth 2.1 (per MCP 2025-11-25 spec) ---
  OAUTH_ENABLED:   z.coerce.boolean().default(false),
  OAUTH_ISSUER:    z.string().url().optional(),
  OAUTH_AUDIENCE:  z.string().min(1).optional(),
  OAUTH_JWKS_URI:  z.string().url().optional(),
  OAUTH_RESOURCE:  z.string().url().optional(),

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

type Raw = z.infer<typeof Schema>;

export interface Config extends Raw {
  /** Resolved per-chain canonical addresses, with env overrides applied. */
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
  const parsed = Schema.parse(env);
  const chainKey = parsed.CHAIN as ChainKey;
  const onchain = ADDRESSES[chainKey];

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
