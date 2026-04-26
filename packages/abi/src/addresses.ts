/**
 * Canonical contract addresses per supported chain.
 *
 * The protocol contracts on Base mainnet are placeholders here until
 * the production deploy lands; the file is the single source of truth
 * for *every* off-chain consumer (gateway, indexer, frontend, SDK).
 *
 * Update procedure after a mainnet deploy:
 *   1. Run `forge script Deploy.s.sol --broadcast --verify`.
 *   2. Capture the printed addresses into the matching block below.
 *   3. Bump @modula/abi semver minor version.
 *   4. Open a PR. CI runs `pnpm typecheck` against the consuming apps.
 */

export const ADDRESSES = {
  base: {
    chainId: 8453,
    name: "Base",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",

    // Set after the canonical mainnet deploy.
    registry:        "0x0000000000000000000000000000000000000000",
    factory:         "0x0000000000000000000000000000000000000000",
    accessRouter:    "0x0000000000000000000000000000000000000000",
    appImpl:         "0x0000000000000000000000000000000000000000",
    agencyImpl:      "0x0000000000000000000000000000000000000000",
  },

  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",

    // Set after the testnet deploy.
    registry:        "0x0000000000000000000000000000000000000000",
    factory:         "0x0000000000000000000000000000000000000000",
    accessRouter:    "0x0000000000000000000000000000000000000000",
    appImpl:         "0x0000000000000000000000000000000000000000",
    agencyImpl:      "0x0000000000000000000000000000000000000000",
  },
} as const;

export type ChainKey = keyof typeof ADDRESSES;
export type ChainConfig = (typeof ADDRESSES)[ChainKey];

/// @notice Resolve a chain config by chainId. Throws on unsupported.
export function chainById(id: number): ChainConfig {
  for (const c of Object.values(ADDRESSES)) {
    if (c.chainId === id) return c;
  }
  throw new Error(`unsupported chainId: ${id}`);
}
