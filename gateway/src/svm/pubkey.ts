/**
 * Pure-TS Solana pubkey validator.
 *
 * A Solana public key is a 32-byte ed25519 public key serialized as a
 * base58 string (32 to 44 characters depending on leading zero bytes).
 * The gateway validates pubkey-shaped strings on every payment payload
 * before handing them to @solana/web3.js — failing fast on garbage
 * keeps the heavy library out of the rejection path.
 *
 * Implementation note: we do the base58 alphabet check here without
 * pulling in `bs58` because we only need rejection-time validation —
 * the actual decode happens inside @solana/web3.js's PublicKey
 * constructor downstream.
 */

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const BASE58_SET = new Set(BASE58_ALPHABET);

/// @notice Minimum length of a base58-encoded 32-byte value (all
///         high bytes — extremely rare; in practice keys are 43-44 chars).
const MIN_LEN = 32;
/// @notice Maximum length of a base58-encoded 32-byte value (all
///         low bytes — also rare).
const MAX_LEN = 44;

/**
 * @returns true if `s` looks like a base58-encoded Solana public key.
 *          Does NOT verify the byte length post-decode — the
 *          downstream PublicKey constructor handles that. False
 *          rejects garbage and 0x-prefixed EVM addresses cheaply.
 */
export function isPubkeyShaped(s: unknown): s is string {
  if (typeof s !== "string") return false;
  if (s.length < MIN_LEN || s.length > MAX_LEN) return false;
  for (let i = 0; i < s.length; i++) {
    if (!BASE58_SET.has(s[i]!)) return false;
  }
  return true;
}

/**
 * @throws Error  if `s` is not a base58 pubkey-shaped string.
 *                Error message includes the field name for context.
 */
export function assertPubkey(s: unknown, field: string): asserts s is string {
  if (!isPubkeyShaped(s)) {
    throw new Error(`${field} is not a base58 pubkey-shaped string`);
  }
}
