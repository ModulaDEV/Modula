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

/// @notice The 402-response payload the server returns when payment is missing.
///         Base64 of this lands in the `PAYMENT-REQUIRED` header.
export interface PaymentRequirements {
  scheme:            X402Scheme;
  network:           X402Network;
  maxAmountRequired: string;          // base units (decimal string)
  asset:             `0x${string}`;   // ERC-20 contract — USDC for us
  payTo:             `0x${string}`;   // creator treasury
  resource:          string;          // canonical URL of the resource
  description:       string;          // human-readable purpose
  mimeType:          string;          // expected response content-type
  maxTimeoutSeconds: number;          // signed authorization validity window
  outputSchema?:     unknown;         // optional MCP outputSchema, JSON-encoded
  extra?:            Record<string, unknown>;
}

/// @notice The signed payload the client returns in `PAYMENT-SIGNATURE`.
export interface PaymentPayload {
  scheme:  X402Scheme;
  network: X402Network;
  payload: ExactEvmPayload;
}

/// @notice EIP-3009 transferWithAuthorization fields plus the v/r/s
///         signature. Modula consumes only this `exact` scheme variant
///         in v1.
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

/// @notice Returned by the facilitator's /verify.
export interface FacilitatorVerify {
  isValid:        boolean;
  invalidReason?: string;
  payer?:         `0x${string}`;
}

/// @notice Returned by the facilitator's /settle. Encoded back into
///         the `PAYMENT-RESPONSE` header.
export interface FacilitatorSettle {
  success:    boolean;
  errorReason?: string;
  txHash?:    `0x${string}`;
  networkId:  number;
  payer?:     `0x${string}`;
}
