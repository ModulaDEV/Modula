/**
 * SVM-specific error subclasses.
 *
 * The gateway already has a small error hierarchy in src/errors.ts
 * that maps to HTTP status codes via Hono's onError. The classes
 * here extend that hierarchy with reasons that only make sense on
 * the SVM rail — invalid mint, blockhash too old, transfer recipient
 * mismatch — so logs and 402 responses carry actionable detail
 * instead of a generic "facilitator rejected payment".
 */
import { PaymentRequired, BadRequest } from "../errors.js";

/// @notice The signed transaction's destination ATA does not derive
///         from the requirements' payTo + asset pair.
export class WrongRecipient extends PaymentRequired {
  constructor(expected: string, actual: string) {
    super(`svm payment recipient mismatch: expected ${expected}, got ${actual}`);
    this.name = "WrongRecipient";
  }
}

/// @notice The signed transaction's transfer amount does not match the
///         requirements' maxAmountRequired (in base units).
export class WrongAmount extends PaymentRequired {
  constructor(expected: bigint, actual: bigint) {
    super(`svm payment amount mismatch: expected ${expected}, got ${actual}`);
    this.name = "WrongAmount";
  }
}

/// @notice The recent blockhash baked into the signed transaction is
///         older than MAX_TX_AGE_SECONDS or is unknown to the cluster.
export class StaleBlockhash extends PaymentRequired {
  constructor(age?: number) {
    super(
      age !== undefined
        ? `svm payment blockhash is stale (${age}s old)`
        : "svm payment blockhash is stale or unknown to the cluster",
    );
    this.name = "StaleBlockhash";
  }
}

/// @notice The signed transaction transfers a mint other than the
///         configured cluster USDC mint. Most common cause: a client
///         on devnet sending mainnet USDC mint, or vice-versa.
export class WrongMint extends PaymentRequired {
  constructor(expected: string, actual: string) {
    super(`svm payment mint mismatch: expected ${expected}, got ${actual}`);
    this.name = "WrongMint";
  }
}

/// @notice The signed transaction's signers list does not include the
///         claimed payer pubkey.
export class PayerMismatch extends BadRequest {
  constructor(claimed: string) {
    super(`claimed payer ${claimed} is not a signer on the transaction`);
    this.name = "PayerMismatch";
  }
}
