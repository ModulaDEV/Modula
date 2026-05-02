/**
 * SVM auto-pay helper — given a PaymentRequirements challenge from the
 * gateway and an SvmSigner, builds an SPL Token-2022 transfer
 * transaction, gets it signed, and returns the base64
 * PAYMENT-SIGNATURE the gateway expects.
 *
 * The SDK does NOT import @solana/web3.js. The transaction-building
 * step is delegated to a `buildTransfer` function the caller passes in
 * (typically from @modula/sdk-solana, which does the heavy lifting
 * with @solana/web3.js + @solana/spl-token). This keeps EVM-only
 * users on a sub-50KB bundle.
 *
 * The full signed-transfer flow runs inside the buildTransfer +
 * signTransaction pipeline; the SDK just wraps the result in the x402
 * wire envelope and base64-encodes it.
 */
import type { SvmSigner, SvmPaymentRequirements } from "./svm-types.js";

/**
 * The transfer-builder signature. Implementations:
 *   1. Connect to the cluster RPC (caller's responsibility).
 *   2. Look up the payer's USDC associated token account (ATA).
 *   3. Resolve or create the recipient's USDC ATA.
 *   4. Build a Token-2022 `transferChecked` ix to the recipient ATA.
 *   5. Wrap in a VersionedTransaction with a recent blockhash.
 *   6. Return the base64-serialized unsigned transaction.
 *
 * The default builder ships in @modula/sdk-solana; users can pass a
 * custom one for advanced flows (priority fees, custom payers, etc.).
 */
export type SvmTransferBuilder = (input: {
  payer:    string; // base58 pubkey
  payTo:    string; // base58 pubkey
  mint:     string; // base58 SPL mint
  amount:   bigint; // base units
  network:  SvmPaymentRequirements["network"];
}) => Promise<string>;

/**
 * Build a base64 PAYMENT-SIGNATURE from a decoded SvmPaymentRequirements
 * challenge plus an SvmSigner.
 *
 * The returned string is the base64-encoded JSON of the
 * SvmPaymentPayload the gateway's SVM facilitator expects.
 */
export async function svmSignPayment(
  reqs: SvmPaymentRequirements,
  signer: SvmSigner,
  buildTransfer: SvmTransferBuilder,
): Promise<string> {
  if (reqs.network !== "solana" && reqs.network !== "solana-devnet") {
    throw new Error(`unsupported SVM network: ${reqs.network}`);
  }

  const unsigned = await buildTransfer({
    payer:   signer.publicKey,
    payTo:   reqs.payTo,
    mint:    reqs.asset,
    amount:  BigInt(reqs.maxAmountRequired),
    network: reqs.network,
  });

  const signed = await signer.signTransaction(unsigned);

  const payload = {
    scheme:  "exact",
    network: reqs.network,
    payload: {
      transaction: signed,
      payer:       signer.publicKey,
    },
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Parse the gateway's base64 PAYMENT-REQUIRED header into an
 * SvmPaymentRequirements struct.
 *
 * @throws Error  if the requirements network is not an SVM literal.
 */
export function svmDecodeRequirements(header: string): SvmPaymentRequirements {
  const obj = JSON.parse(atob(header)) as SvmPaymentRequirements;
  if (obj.network !== "solana" && obj.network !== "solana-devnet") {
    throw new Error(
      `requirements network is not SVM (got ${obj.network})`,
    );
  }
  return obj;
}
