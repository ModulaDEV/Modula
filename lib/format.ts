/**
 * Display formatters for API → UI.
 *
 * The read API returns precise raw values (bytes32 hex, ISO timestamps,
 * numeric strings); the registry UI shows abbreviated, human-readable
 * versions. These helpers are the single boundary that compresses.
 */

/** "0x4a7fdc31...b12c" → "0x4a7f…b12c" — 6 + 4 hex chars with an ellipsis. */
export function shortHex(hex: string): string {
  if (!hex.startsWith("0x") || hex.length <= 13) return hex;
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

/** 412231 → "412k", 1245678 → "1.2M", 0 → "0". */
export function formatCount(n: number): string {
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) {
    const k = n / 1_000;
    return k >= 100 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  const m = n / 1_000_000;
  return m >= 100 ? `${Math.round(m)}M` : `${m.toFixed(1).replace(/\.0$/, "")}M`;
}

/** "0.002100" → "0.0021" — strip trailing zeros, keep at least 4 sig digits. */
export function formatPrice(usdc: string | null | undefined): string {
  if (!usdc) return "—";
  const n = parseFloat(usdc);
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(4);
  return n.toPrecision(2);
}

/**
 * Bonding-curve multiplier — latest_price / base_premium, e.g. "4.2×".
 * basePremium is the model's starting price (from the Agency's assetData).
 * If we don't have it client-side yet, return null and let the caller hide.
 */
export function curveMultiplier(latestUsdc: string | null, basePremiumUsdc: string | null): string | null {
  if (!latestUsdc || !basePremiumUsdc) return null;
  const latest = parseFloat(latestUsdc);
  const base   = parseFloat(basePremiumUsdc);
  if (!Number.isFinite(latest) || !Number.isFinite(base) || base === 0) return null;
  const ratio = latest / base;
  if (ratio < 10) return `${ratio.toFixed(1)}×`;
  return `${Math.round(ratio)}×`;
}

/** ["0.001000","0.002000",…] → number[] for the SVG sparkline. */
export function trendToNumbers(trend: string[]): number[] {
  return trend.map((s) => parseFloat(s)).filter((n) => Number.isFinite(n));
}

/** "ipfs://Qm..." → gateway URL using a public IPFS gateway. */
export function ipfsUrl(uri: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.slice("ipfs://".length)}`;
  return uri;
}

/** ISO timestamp → "2 hours ago", "3 days ago". */
export function timeAgo(iso: string): string {
  const ms   = Date.now() - new Date(iso).getTime();
  const sec  = Math.floor(ms / 1000);
  if (sec < 60)        return `${sec}s ago`;
  const min  = Math.floor(sec / 60);
  if (min < 60)        return `${min}m ago`;
  const hour = Math.floor(min / 60);
  if (hour < 24)       return `${hour}h ago`;
  const day  = Math.floor(hour / 24);
  if (day < 30)        return `${day}d ago`;
  const month = Math.floor(day / 30);
  return `${month}mo ago`;
}
