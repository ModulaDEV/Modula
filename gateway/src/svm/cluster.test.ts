import { describe, it, expect } from "vitest";
import {
  usdcMintFor,
  defaultRpcUrlFor,
  clusterDisplayName,
} from "./cluster.js";
import {
  USDC_MINT_MAINNET,
  USDC_MINT_DEVNET,
  RPC_URL_MAINNET,
  RPC_URL_DEVNET,
} from "./constants.js";

describe("usdcMintFor", () => {
  it("returns the canonical mainnet USDC mint for solana", () => {
    expect(usdcMintFor("solana")).toBe(USDC_MINT_MAINNET);
  });

  it("returns the canonical devnet USDC mint for solana-devnet", () => {
    expect(usdcMintFor("solana-devnet")).toBe(USDC_MINT_DEVNET);
  });

  it("never returns the same mint for both networks", () => {
    expect(usdcMintFor("solana")).not.toBe(usdcMintFor("solana-devnet"));
  });
});

describe("defaultRpcUrlFor", () => {
  it("returns the mainnet RPC for solana", () => {
    expect(defaultRpcUrlFor("solana")).toBe(RPC_URL_MAINNET);
  });

  it("returns the devnet RPC for solana-devnet", () => {
    expect(defaultRpcUrlFor("solana-devnet")).toBe(RPC_URL_DEVNET);
  });
});

describe("clusterDisplayName", () => {
  it("renders human-readable mainnet name", () => {
    expect(clusterDisplayName("solana")).toBe("Solana mainnet-beta");
  });

  it("renders human-readable devnet name", () => {
    expect(clusterDisplayName("solana-devnet")).toBe("Solana devnet");
  });
});
