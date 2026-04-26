/**
 * Encode + decode the base64-JSON wire format used by x402 headers.
 *
 *   PAYMENT-REQUIRED  : base64(JSON(PaymentRequirements))
 *   PAYMENT-SIGNATURE : base64(JSON(PaymentPayload))
 *   PAYMENT-RESPONSE  : base64(JSON(FacilitatorSettle))
 */
import type {
  PaymentRequirements,
  PaymentPayload,
  FacilitatorSettle,
} from "./types.js";
import { BadRequest } from "../errors.js";

const enc = (v: unknown): string =>
  Buffer.from(JSON.stringify(v), "utf8").toString("base64");

const dec = (s: string): unknown => {
  try {
    return JSON.parse(Buffer.from(s, "base64").toString("utf8"));
  } catch (e) {
    throw new BadRequest("payment header is not valid base64-encoded JSON", e);
  }
};

export function encodeRequirements(r: PaymentRequirements): string {
  return enc(r);
}

export function encodeSettlement(s: FacilitatorSettle): string {
  return enc(s);
}

export function decodePayment(headerValue: string): PaymentPayload {
  const obj = dec(headerValue) as Partial<PaymentPayload>;
  if (
    !obj ||
    typeof obj !== "object" ||
    typeof obj.scheme  !== "string" ||
    typeof obj.network !== "string" ||
    typeof obj.payload !== "object"
  ) {
    throw new BadRequest("payment payload is missing required fields");
  }
  return obj as PaymentPayload;
}
