/**
 * Tests for the SDK's SVM autopay surface.
 *
 * Covers the round-trip behavior of svmSignPayment +
 * svmDecodeRequirements without any real Solana cluster — the
 * SvmTransferBuilder is stubbed and the SvmSigner just echoes the
 * input. This is the contract test, not an integration test.
 */
import { describe, it, expect } from "vitest";
import {
  svmSignPayment,
  svmDecodeRequirements,
  type SvmTransferBuilder,
} from "./svm-autopay.js";
import type { SvmSigner, SvmPaymentRequirements } from "./svm-types.js";

const FAKE_PUBKEY = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const stubSigner: SvmSigner = {
  publicKey:       FAKE_PUBKEY,
  signTransaction: async (txBase64: string) =>
    `signed:${txBase64}`,
};

const stubBuilder: SvmTransferBuilder = async (input) =>
  Buffer.from(
    JSON.stringify({ ...input, amount: input.amount.toString() }),
  ).toString("base64");

const validReqs: SvmPaymentRequirements = {
  scheme:            "exact",
  network:           "solana-devnet",
  maxAmountRequired: "1000000",
  asset:             FAKE_PUBKEY,
  payTo:             FAKE_PUBKEY,
  resource:          "/m/0xfeedbeef/mcp/svm",
  description:       "inference · test-model · svm",
  mimeType:          "application/json",
  maxTimeoutSeconds: 90,
};

describe("svmSignPayment", () => {
  it("returns a base64 payload for a valid SVM challenge", async () => {
    const out = await svmSignPayment(validReqs, stubSigner, stubBuilder);
    expect(typeof out).toBe("string");
    const decoded = JSON.parse(atob(out));
    expect(decoded.scheme).toBe("exact");
    expect(decoded.network).toBe("solana-devnet");
    expect(decoded.payload.payer).toBe(FAKE_PUBKEY);
    expect(decoded.payload.transaction).toMatch(/^signed:/);
  });

  it("invokes the builder with the requirements + payer pubkey", async () => {
    let capturedInput: Parameters<SvmTransferBuilder>[0] | null = null;
    const recordingBuilder: SvmTransferBuilder = async (input) => {
      capturedInput = input;
      return Buffer.from("noop").toString("base64");
    };
    await svmSignPayment(validReqs, stubSigner, recordingBuilder);
    expect(capturedInput).not.toBeNull();
    expect(capturedInput!.payer).toBe(FAKE_PUBKEY);
    expect(capturedInput!.payTo).toBe(validReqs.payTo);
    expect(capturedInput!.mint).toBe(validReqs.asset);
    expect(capturedInput!.amount).toBe(1_000_000n);
    expect(capturedInput!.network).toBe("solana-devnet");
  });

  it("works for solana mainnet network", async () => {
    const out = await svmSignPayment(
      { ...validReqs, network: "solana" },
      stubSigner,
      stubBuilder,
    );
    expect(JSON.parse(atob(out)).network).toBe("solana");
  });

  it("rejects an EVM network", async () => {
    await expect(
      svmSignPayment(
        { ...validReqs, network: "base" as never },
        stubSigner,
        stubBuilder,
      ),
    ).rejects.toThrow(/unsupported SVM network/);
  });
});

describe("svmDecodeRequirements", () => {
  it("round-trips a valid SVM requirements struct", () => {
    const enc = btoa(JSON.stringify(validReqs));
    const out = svmDecodeRequirements(enc);
    expect(out.network).toBe("solana-devnet");
    expect(out.maxAmountRequired).toBe("1000000");
    expect(out.payTo).toBe(FAKE_PUBKEY);
  });

  it("rejects an EVM-network requirements payload", () => {
    const evmReqs = { ...validReqs, network: "base" as never };
    const enc = btoa(JSON.stringify(evmReqs));
    expect(() => svmDecodeRequirements(enc)).toThrow(/not SVM/);
  });
});
