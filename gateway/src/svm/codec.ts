/**
 * SVM payment payload codec.
 *
 * The wire format is identical to the EVM side: base64(JSON(payload)).
 * What differs is the payload shape — SVM payloads carry a base64
 * SPL Token-2022 transfer transaction and a base58 payer pubkey,
 * not an EIP-3009 authorization.
 *
 * Decoding here only validates *shape* — pubkey-shaped payer string,
 * non-empty base64 transaction, network is one of the SVM literals.
 * Cryptographic verification happens in the facilitator client.
 */
import type { SvmPaymentPayload } from "../x402/types.js";
import { isPubkeyShaped } from "./pubkey.js";
import { BadRequest } from "../errors.js";

/**
 * Decode a base64-encoded JSON SVM payment payload from the
 * PAYMENT-SIGNATURE header.
 *
 * @throws BadRequest  malformed base64, missing fields, wrong network
 */
export function decodeSvmPayload(headerValue: string): SvmPaymentPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(headerValue, "base64").toString("utf8"));
  } catch (e) {
    throw new BadRequest("payment header is not valid base64-encoded JSON", e);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new BadRequest("svm payment payload is not an object");
  }

  const obj = parsed as Partial<SvmPaymentPayload>;

  if (obj.scheme !== "exact" && obj.scheme !== "upto") {
    throw new BadRequest("svm payment payload has invalid scheme");
  }
  if (obj.network !== "solana" && obj.network !== "solana-devnet") {
    throw new BadRequest(
      `svm payment payload has wrong network: ${String(obj.network)}`,
    );
  }
  if (!obj.payload || typeof obj.payload !== "object") {
    throw new BadRequest("svm payment payload is missing payload field");
  }

  const inner = obj.payload as Partial<SvmPaymentPayload["payload"]>;

  if (typeof inner.transaction !== "string" || inner.transaction.length === 0) {
    throw new BadRequest("svm payment payload missing transaction bytes");
  }
  if (!isPubkeyShaped(inner.payer)) {
    throw new BadRequest("svm payment payload has invalid payer pubkey");
  }

  return obj as SvmPaymentPayload;
}
