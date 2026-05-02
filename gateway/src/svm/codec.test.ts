/**
 * Tests for the SVM payment payload codec.
 *
 * Wire shape parity with the EVM codec is asserted by hand here —
 * we don't import the EVM codec because the codec contracts are
 * intentionally network-specific (different payload shapes).
 */
import { describe, it, expect } from "vitest";
import { decodeSvmPayload } from "./codec.js";
import { USDC_MINT_DEVNET } from "./constants.js";
import { BadRequest } from "../errors.js";

const validPayload = {
  scheme:  "exact" as const,
  network: "solana-devnet" as const,
  payload: {
    transaction: Buffer.from("fake-signed-spl-tx").toString("base64"),
    payer:       USDC_MINT_DEVNET, // any pubkey-shaped string works for shape test
  },
};

const encode = (v: unknown) =>
  Buffer.from(JSON.stringify(v), "utf8").toString("base64");

describe("decodeSvmPayload — happy path", () => {
  it("round-trips a valid SVM payload", () => {
    const out = decodeSvmPayload(encode(validPayload));
    expect(out.network).toBe("solana-devnet");
    expect(out.scheme).toBe("exact");
    expect(out.payload.payer).toBe(USDC_MINT_DEVNET);
    expect(out.payload.transaction.length).toBeGreaterThan(0);
  });

  it("accepts solana mainnet network", () => {
    const out = decodeSvmPayload(encode({ ...validPayload, network: "solana" }));
    expect(out.network).toBe("solana");
  });

  it("accepts upto scheme variant", () => {
    const out = decodeSvmPayload(encode({ ...validPayload, scheme: "upto" }));
    expect(out.scheme).toBe("upto");
  });
});

describe("decodeSvmPayload — rejection", () => {
  it("rejects malformed base64", () => {
    expect(() => decodeSvmPayload("not-valid-base64!!!")).toThrow(BadRequest);
  });

  it("rejects valid base64 of non-JSON", () => {
    expect(() => decodeSvmPayload(Buffer.from("hello world").toString("base64")))
      .toThrow(BadRequest);
  });

  it("rejects an object that is not a payload struct", () => {
    expect(() => decodeSvmPayload(encode("just-a-string"))).toThrow(BadRequest);
  });

  it("rejects a wrong scheme", () => {
    expect(() => decodeSvmPayload(encode({ ...validPayload, scheme: "bogus" })))
      .toThrow(/invalid scheme/);
  });

  it("rejects an EVM network on the SVM codec", () => {
    expect(() => decodeSvmPayload(encode({ ...validPayload, network: "base" })))
      .toThrow(/wrong network/);
  });

  it("rejects a missing payload field", () => {
    const bad = { scheme: "exact", network: "solana-devnet" };
    expect(() => decodeSvmPayload(encode(bad))).toThrow(/missing payload/);
  });

  it("rejects an empty transaction string", () => {
    const bad = { ...validPayload, payload: { ...validPayload.payload, transaction: "" } };
    expect(() => decodeSvmPayload(encode(bad))).toThrow(/transaction bytes/);
  });

  it("rejects an EVM 0x address as the payer", () => {
    const bad = {
      ...validPayload,
      payload: { ...validPayload.payload, payer: "0xac5292fdf365054f0a597e6f718dfdf3f2708b07" },
    };
    expect(() => decodeSvmPayload(encode(bad))).toThrow(/invalid payer pubkey/);
  });
});
