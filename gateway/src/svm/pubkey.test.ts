/**
 * Tests for the pure-TS pubkey shape validator.
 *
 * Covers the three things callers care about:
 *   1. Real Solana pubkeys are accepted.
 *   2. EVM addresses, empty strings, and base64 garbage are rejected.
 *   3. assertPubkey throws with the field name in the error.
 */
import { describe, it, expect } from "vitest";
import { isPubkeyShaped, assertPubkey } from "./pubkey.js";
import { USDC_MINT_MAINNET, USDC_MINT_DEVNET } from "./constants.js";

describe("isPubkeyShaped", () => {
  it("accepts the canonical USDC mints", () => {
    expect(isPubkeyShaped(USDC_MINT_MAINNET)).toBe(true);
    expect(isPubkeyShaped(USDC_MINT_DEVNET)).toBe(true);
  });

  it("accepts the System Program pubkey", () => {
    expect(isPubkeyShaped("11111111111111111111111111111111")).toBe(true);
  });

  it("accepts the Token Program pubkey", () => {
    expect(isPubkeyShaped("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")).toBe(true);
  });

  it("rejects EVM 0x-prefixed addresses", () => {
    expect(isPubkeyShaped("0xac5292fdf365054f0a597e6f718dfdf3f2708b07")).toBe(false);
  });

  it("rejects the empty string", () => {
    expect(isPubkeyShaped("")).toBe(false);
  });

  it("rejects strings shorter than 32 chars", () => {
    expect(isPubkeyShaped("short")).toBe(false);
    expect(isPubkeyShaped("a".repeat(31))).toBe(false);
  });

  it("rejects strings longer than 44 chars", () => {
    expect(isPubkeyShaped("a".repeat(45))).toBe(false);
  });

  it("rejects strings containing characters outside the base58 alphabet", () => {
    // 0, O, I, l are excluded from base58 to avoid ambiguity
    expect(isPubkeyShaped("0".repeat(43))).toBe(false);
    expect(isPubkeyShaped("O".repeat(43))).toBe(false);
    expect(isPubkeyShaped("I".repeat(43))).toBe(false);
    expect(isPubkeyShaped("l".repeat(43))).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(isPubkeyShaped(undefined)).toBe(false);
    expect(isPubkeyShaped(null)).toBe(false);
    expect(isPubkeyShaped(42)).toBe(false);
    expect(isPubkeyShaped({})).toBe(false);
    expect(isPubkeyShaped([])).toBe(false);
  });
});

describe("assertPubkey", () => {
  it("does not throw for valid pubkeys", () => {
    expect(() => assertPubkey(USDC_MINT_MAINNET, "mint")).not.toThrow();
  });

  it("throws with the field name for invalid pubkeys", () => {
    expect(() => assertPubkey("0xdeadbeef", "treasury")).toThrow(
      /treasury is not a base58 pubkey-shaped string/,
    );
  });

  it("throws for non-string input with the field name", () => {
    expect(() => assertPubkey(undefined, "payer")).toThrow(
      /payer is not a base58 pubkey-shaped string/,
    );
  });
});
