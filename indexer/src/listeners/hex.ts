/**
 * 0x-hex ↔ bytea conversions for Postgres.
 *
 * Postgres `bytea` columns accept Node Buffers directly via the `pg`
 * driver; viem hands us 0x-prefixed lowercase strings. These two
 * helpers make the round-trip explicit so calling code never has to
 * remember the slice/prefix dance.
 */

export function hexToBytea(hex: `0x${string}` | string): Buffer {
  const stripped = hex.startsWith("0x") ? hex.slice(2) : hex;
  return Buffer.from(stripped, "hex");
}

export function byteaToHex(b: Buffer | Uint8Array): `0x${string}` {
  const buf = Buffer.isBuffer(b) ? b : Buffer.from(b);
  return `0x${buf.toString("hex")}` as `0x${string}`;
}
