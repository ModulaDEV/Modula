/**
 * Agent wallet auto-provisioning.
 *
 * getOrCreateWallet()
 *   On first call: generates a random private key, stores it in
 *   localStorage under "modula:wallet", and returns an AutoPaySigner
 *   backed by viem's privateKeyToAccount.
 *   On subsequent calls: rehydrates the same key — the agent's address
 *   is stable across page reloads.
 *
 * fundFromFaucet(address)
 *   Hits the Circle USDC testnet faucet on Base Sepolia. Call once
 *   after getOrCreateWallet() in dev/testnet flows. No-op on mainnet
 *   (faucet rejects non-testnet chains).
 *
 * Requires viem as a peer dependency (same opt-in as autopay.ts).
 */
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import type { AutoPaySigner } from "./autopay.js";

const STORAGE_KEY = "modula:wallet";

export interface WalletOptions {
  /**
   * Which chain to wire the viem WalletClient to.
   * Defaults to "base" (mainnet). Pass "baseSepolia" in dev.
   */
  chain?: "base" | "baseSepolia";
}

/**
 * Returns a stable AutoPaySigner for the current browser session.
 * Generates and persists a private key in localStorage on first call.
 *
 * ⚠ localStorage keys are not hardware-secured. This is intended for
 * dev/agent-script flows where UX friction matters more than custody.
 * For production user wallets, wire a WalletConnect / MetaMask signer.
 */
export function getOrCreateWallet(opts: WalletOptions = {}): AutoPaySigner {
  const chainDef = opts.chain === "baseSepolia" ? baseSepolia : base;

  let pk = localStorage.getItem(STORAGE_KEY) as `0x${string}` | null;
  if (!pk) {
    pk = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}` as `0x${string}`;
    localStorage.setItem(STORAGE_KEY, pk);
  }

  const account = privateKeyToAccount(pk);
  const client  = createWalletClient({
    account,
    chain:     chainDef,
    transport: http(),
  });

  return {
    address: account.address,
    signTypedData: (args) =>
      client.signTypedData({ account, ...args } as never),
  };
}

/**
 * Clears the stored wallet key from localStorage.
 * The next call to getOrCreateWallet() will generate a fresh key.
 */
export function clearWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Fund the given address with testnet USDC via the Circle faucet.
 * Only works on Base Sepolia — call this once in dev after
 * getOrCreateWallet({ chain: "baseSepolia" }).
 */
export async function fundFromFaucet(address: `0x${string}`): Promise<void> {
  const res = await fetch("https://faucet.circle.com/api/faucet", {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body:    JSON.stringify({ address, chain: "base-sepolia" }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString());
    throw new Error(`faucet failed: ${text}`);
  }
}
