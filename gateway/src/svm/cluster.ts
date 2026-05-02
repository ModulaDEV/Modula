/**
 * Cluster lookup helpers — given an SVM network literal, return the
 * canonical USDC SPL mint and the default JSON-RPC URL.
 *
 * The gateway calls these at boot time when SVM_ENABLED=true. The
 * RPC URL can be overridden via SVM_RPC_URL; the mint cannot — it
 * is the canonical Circle-issued mint per cluster.
 */
import {
  USDC_MINT_MAINNET,
  USDC_MINT_DEVNET,
  RPC_URL_MAINNET,
  RPC_URL_DEVNET,
} from "./constants.js";

type SvmNetwork = "solana" | "solana-devnet";

/// @notice Returns the canonical Circle-issued USDC SPL mint for the
///         given cluster.
export function usdcMintFor(network: SvmNetwork): string {
  return network === "solana" ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
}

/// @notice Returns the public Solana JSON-RPC URL for the given
///         cluster. Production should override via SVM_RPC_URL with
///         a paid RPC (Helius / Triton / QuickNode).
export function defaultRpcUrlFor(network: SvmNetwork): string {
  return network === "solana" ? RPC_URL_MAINNET : RPC_URL_DEVNET;
}

/// @notice Returns a human-readable cluster name suitable for log
///         lines and OpenAPI metadata.
export function clusterDisplayName(network: SvmNetwork): string {
  return network === "solana" ? "Solana mainnet-beta" : "Solana devnet";
}
