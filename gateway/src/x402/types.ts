/**
 * x402 wire types — mirrors the shapes in the public x402 spec
 * (github.com/coinbase/x402, codified by the x402 Foundation in 2026).
 *
 * Only the subset Modula uses is modeled. We're an 'exact' scheme
 * server on Base; we don't accept native ETH and we don't produce
 * 'upto' challenges in v1.
 */

export type X402Scheme  = "exact" | "upto";

/**
 * Networks the gateway can settle on. EVM networks use the EIP-3009
 * `transferWithAuthorization` flow; SVM networks (Solana mainnet +
 * devnet) use a signed SPL Token-2022 transfer. Both are valid `exact`
 * scheme variants per the x402 spec, but they carry completely
 * different payload shapes.
 */
export type X402Network =
  | "base"
  | "base-sepolia"
  | "solana"
  | "solana-devnet";

/// @notice True when the network settles on an EVM chain.
export function isEvmNetwork(n: X402Network): n is "base" | "base-sepolia" {
  return n === "base" || n === "base-sepolia";
}

/// @notice True when the network settles on Solana (mainnet or devnet).
export function isSvmNetwork(n: X402Network): n is "solana" | "solana-devnet" {
  return n === "solana" || n === "solana-devnet";
}

/**
 * Wire address format. EVM addresses are 0x-prefixed 40-hex; SVM
 * addresses are base58-encoded 32-byte public keys. The codec layer
 * never coerces between the two — the caller picks the right shape
 * based on `network`.
 */
export type WireAddress = string;

/// @notice The 402-response payload the server returns when payment is missing.
///         Base64 of this lands in the `PAYMENT-REQUIRED` header.
export interface PaymentRequirements {
  scheme:            X402Scheme;
  network:           X402Network;
  maxAmountRequired: string;          // base units (decimal string)
  asset:             WireAddress;     // EVM: ERC-20 USDC · SVM: SPL mint pubkey
  payTo:             WireAddress;     // creator treasury (EVM addr or SVM pubkey)
  resource:          string;          // canonical URL of the resource
  description:       string;          // human-readable purpose
  mimeType:          string;          // expected response content-type
  maxTimeoutSeconds: number;          // signed authorization validity window
  outputSchema?:     unknown;         // optional MCP outputSchema, JSON-encoded
  extra?:            Record<string, unknown>;
}

/**
 * Discriminated union — the payload shape varies by network family.
 * EVM networks carry an EIP-3009 authorization; SVM networks carry a
 * pre-signed SPL Token-2022 transfer transaction.
 */
export type PaymentPayload = EvmPaymentPayload | SvmPaymentPayload;

export interface EvmPaymentPayload {
  scheme:  X402Scheme;
  network: "base" | "base-sepolia";
  payload: ExactEvmPayload;
}

export interface SvmPaymentPayload {
  scheme:  X402Scheme;
  network: "solana" | "solana-devnet";
  payload: ExactSvmPayload;
}

/// @notice EIP-3009 transferWithAuthorization fields plus the v/r/s
///         signature.
export interface ExactEvmPayload {
  signature:        `0x${string}`;
  authorization: {
    from:           `0x${string}`;
    to:             `0x${string}`;
    value:          string;       // base units (decimal string)
    validAfter:     string;       // unix seconds
    validBefore:    string;       // unix seconds
    nonce:          `0x${string}`;
  };
}

/**
 * SVM `exact` scheme — a partially-signed SPL Token-2022 transfer
 * transaction. The client constructs the SPL transfer, signs it with
 * the payer keypair (or a wallet-adapter-provided signer), and sends
 * the base64-encoded transaction bytes to the gateway.
 *
 * The facilitator verifies the signature, simulates the transfer,
 * and on /settle submits it to the cluster. The payer pubkey is
 * recovered from the signed transaction's signers list.
 */
export interface ExactSvmPayload {
  /// @notice Base64-encoded VersionedTransaction or legacy Transaction
  ///         bytes. The transaction must transfer exactly
  ///         `maxAmountRequired` of the SPL `asset` mint to `payTo`.
  transaction:  string;
  /// @notice Payer pubkey (base58). Redundant with the tx signers list
  ///         but included for cheap pre-flight checks before deserializing.
  payer:        string;
}

/// @notice Returned by the facilitator's /verify.
export interface FacilitatorVerify {
  isValid:        boolean;
  invalidReason?: string;
  payer?:         WireAddress;
}

/// @notice Returned by the facilitator's /settle. Encoded back into
///         the `PAYMENT-RESPONSE` header.
export interface FacilitatorSettle {
  success:    boolean;
  errorReason?: string;
  /// @notice EVM: 0x-prefixed 32-byte tx hash. SVM: base58 tx signature.
  txHash?:    string;
  networkId:  number;
  payer?:     WireAddress;
}
