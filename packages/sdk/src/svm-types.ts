/**
 * SDK-side SVM types — kept independent of the gateway's internal
 * types so the SDK builds without depending on @modula/gateway.
 *
 * These mirror gateway/src/x402/types.ts and gateway/src/x402/svm
 * but are duplicated by design — the SDK is shippable as a public
 * npm package and must not pull in private workspace packages.
 */

/// @notice The SVM networks the SDK can sign payments on.
export type SvmNetwork = "solana" | "solana-devnet";

/**
 * Minimal Solana signer interface the SDK accepts. Compatible with:
 *   - `@solana/web3.js` Keypair (via .secretKey + .publicKey)
 *   - any Wallet Adapter signer (Phantom, Backpack, Solflare …)
 *   - test-only in-memory signers
 *
 * The SDK never imports @solana/web3.js directly — callers pass an
 * adapter that fits this shape, keeping bundle size minimal for
 * users who only need EVM.
 */
export interface SvmSigner {
  /** Base58-encoded payer pubkey. */
  publicKey: string;

  /**
   * Sign a serialized Solana transaction (base64 string of either
   * legacy Transaction or VersionedTransaction bytes) and return the
   * fully-signed transaction in the same format.
   *
   * Implementations typically:
   *   1. base64-decode the input
   *   2. deserialize into the appropriate Transaction class
   *   3. .sign() with the keypair / wallet
   *   4. serialize + base64-encode the result
   */
  signTransaction: (txBase64: string) => Promise<string>;
}

/**
 * Subset of the gateway's PaymentRequirements relevant to the SVM
 * signer. The SDK pulls these fields off the decoded
 * PAYMENT-REQUIRED header before building a transfer.
 */
export interface SvmPaymentRequirements {
  scheme:            string;
  network:           SvmNetwork;
  /** Base units of the SPL token (USDC = 6 decimals). */
  maxAmountRequired: string;
  /** Base58 SPL mint pubkey. */
  asset:             string;
  /** Base58 destination pubkey (treasury). */
  payTo:             string;
  resource:          string;
  description:       string;
  mimeType:          string;
  maxTimeoutSeconds: number;
}
