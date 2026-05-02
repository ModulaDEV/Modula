/**
 * Solana cluster constants for the indexer's SVM event source.
 *
 * Mirrors gateway/src/svm/constants.ts but duplicated rather than
 * imported — the indexer is a separate service that can be deployed
 * without the gateway, and we don't want a workspace-only dep on
 * @modula/gateway in the indexer's runtime.
 */

export const USDC_MINT_MAINNET =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const USDC_MINT_DEVNET =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const RPC_URL_MAINNET = "https://api.mainnet-beta.solana.com";
export const RPC_URL_DEVNET  = "https://api.devnet.solana.com";

/// @notice Number of SPL transfer signatures the indexer fetches per
///         poll tick. Higher = faster catch-up, lower = friendlier to
///         the public RPC. The Helius/Triton paid tier should easily
///         handle 1000.
export const SIGNATURES_PER_TICK = 100;

/// @notice Polling cadence in milliseconds. Solana blocks finalize
///         in ~13s; polling every 5s keeps the indexer one block
///         behind in the worst case.
export const POLL_INTERVAL_MS = 5_000;
