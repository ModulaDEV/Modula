import { describe, expect, test } from "vitest";
import { hexToBytea, byteaToHex } from "./hex.js";

describe("hex helpers", () => {
  test("round-trips a 20-byte address", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(byteaToHex(hexToBytea(addr))).toBe(addr);
  });

  test("round-trips a 32-byte hash", () => {
    const hash = "0x" + "ab".repeat(32);
    expect(byteaToHex(hexToBytea(hash))).toBe(hash);
  });

  test("hexToBytea strips the 0x prefix", () => {
    expect(hexToBytea("0xdeadbeef").toString("hex")).toBe("deadbeef");
    expect(hexToBytea("deadbeef").toString("hex")).toBe("deadbeef");
  });

  test("byteaToHex always lowercases the prefix", () => {
    const buf = Buffer.from("ABCDEF01", "hex");
    const h   = byteaToHex(buf);
    expect(h.startsWith("0x")).toBe(true);
    expect(h).toMatch(/^0x[0-9a-f]+$/); // lowercase only
  });

  test("byteaToHex accepts Uint8Array as well as Buffer", () => {
    const u = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(byteaToHex(u)).toBe("0xdeadbeef");
  });
});
