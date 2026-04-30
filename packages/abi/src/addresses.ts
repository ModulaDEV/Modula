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

    // Deployed 2026-04-29 via contracts/script/Deploy.s.sol (chain 8453).
    registry:        "0x49E1Ed74bcaDd4EDF38520EC8330391b9E745F52",
    factory:         "0xf4B028367012bA8D42fB2D1a9bD0A69b0429eE98",
    accessRouter:    "0xb1f2ce5B129d4ea92375425A3F1678aEd4c5d188",
    appImpl:         "0x6e5b4DA9469d98520BB3dBb232F16cbb799aeB61",
    agencyImpl:      "0xb76763aAeE3Fa60ab39f9586886dFBc6B8cba704",
  },

  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",

    // Deployed 2026-04-27 via contracts/script/Deploy.s.sol.
    registry:        "0x49E1Ed74bcaDd4EDF38520EC8330391b9E745F52",
    factory:         "0xf4B028367012bA8D42fB2D1a9bD0A69b0429eE98",
    accessRouter:    "0xb1f2ce5B129d4ea92375425A3F1678aEd4c5d188",
    appImpl:         "0x6e5b4DA9469d98520BB3dBb232F16cbb799aeB61",
    agencyImpl:      "0xb76763aAeE3Fa60ab39f9586886dFBc6B8cba704",
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
