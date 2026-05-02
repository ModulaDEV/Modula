/**
 * Solana cluster constants used by the SVM x402 settlement path.
 *
 * USDC mints are the canonical Circle-issued mints on each cluster.
 * Default cluster RPC URLs are the public Solana endpoints — fine for
 * dev and CI but the gateway should be configured with a paid RPC
 * (Helius / Triton / QuickNode / Alchemy) in production via the
 * SOLANA_RPC_URL env var.
 */

/// @notice Canonical Circle-issued USDC SPL mint, mainnet-beta.
export const USDC_MINT_MAINNET =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/// @notice Canonical Circle-issued USDC SPL mint, devnet.
export const USDC_MINT_DEVNET =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/// @notice Public Solana JSON-RPC, mainnet-beta. Rate-limited; use a
///         paid RPC in production.
export const RPC_URL_MAINNET = "https://api.mainnet-beta.solana.com";

/// @notice Public Solana JSON-RPC, devnet.
export const RPC_URL_DEVNET = "https://api.devnet.solana.com";

/// @notice Number of decimals for USDC on Solana (matches Base USDC).
export const USDC_DECIMALS = 6;

/// @notice Solana commitment level used for /verify simulation and
///         /settle confirmation. "confirmed" gives ~400ms finality
///         while still being safe against fork resolution; matches
///         Coinbase's recommended commitment for x402 settlement.
export const COMMITMENT = "confirmed" as const;

/// @notice Maximum age (seconds) of a recent blockhash that the
///         gateway will accept inside a signed payment transaction.
///         Solana validators reject transactions older than ~2 min;
///         we cap at 90s to stay safely inside the validator window
///         and to match the EVM-side maxTimeoutSeconds semantics.
export const MAX_TX_AGE_SECONDS = 90;
