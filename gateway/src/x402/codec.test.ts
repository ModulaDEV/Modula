import { describe, it, expect } from "vitest";

import { encodeRequirements, encodeSettlement, decodePayment } from "./codec.js";
import type {
  PaymentRequirements,
  PaymentPayload,
  FacilitatorSettle,
} from "./types.js";

const sampleReq: PaymentRequirements = {
  scheme:            "exact",
  network:           "base",
  maxAmountRequired: "1030",
  asset:             "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  payTo:             "0x000000000000000000000000000000000000bEEF",
  resource:          "https://mcp.modulabase.org/m/0x4a7f.../mcp",
  description:       "inference · solidity-audit-v3",
  mimeType:          "application/json",
  maxTimeoutSeconds: 60,
};

const samplePayload: PaymentPayload = {
  scheme:  "exact",
  network: "base",
  payload: {
    signature: ("0x" + "ab".repeat(65)) as `0x${string}`,
    authorization: {
      from:        "0x000000000000000000000000000000000000A11C",
      to:          "0x000000000000000000000000000000000000bEEF",
      value:       "1030",
      validAfter:  "1700000000",
      validBefore: "1700000060",
      nonce:       ("0x" + "12".repeat(32)) as `0x${string}`,
    },
  },
};

const sampleSettle: FacilitatorSettle = {
  success:   true,
  txHash:    ("0x" + "fe".repeat(32)) as `0x${string}`,
  networkId: 8453,
  payer:     "0x000000000000000000000000000000000000A11C",
};

describe("x402 codec", () => {
  it("encode/decode requirements round-trips", () => {
    const enc = encodeRequirements(sampleReq);
    expect(enc).toMatch(/^[A-Za-z0-9+/=]+$/);
    const dec = JSON.parse(Buffer.from(enc, "base64").toString("utf8"));
    expect(dec).toEqual(sampleReq);
  });

  it("encode/decode settlement round-trips", () => {
    const enc = encodeSettlement(sampleSettle);
    const dec = JSON.parse(Buffer.from(enc, "base64").toString("utf8"));
    expect(dec).toEqual(sampleSettle);
  });

  it("decodePayment accepts well-formed input", () => {
    const enc = Buffer.from(JSON.stringify(samplePayload)).toString("base64");
    const dec = decodePayment(enc);
    expect(dec).toEqual(samplePayload);
  });

  it("decodePayment rejects malformed base64", () => {
    expect(() => decodePayment("not!base64@")).toThrow();
  });

  it("decodePayment rejects malformed JSON", () => {
    const enc = Buffer.from("{ not json").toString("base64");
    expect(() => decodePayment(enc)).toThrow();
  });

  it("decodePayment rejects payloads missing required fields", () => {
    const partial = Buffer.from(JSON.stringify({ scheme: "exact" })).toString("base64");
    expect(() => decodePayment(partial)).toThrow(/missing required fields/);
  });
});
