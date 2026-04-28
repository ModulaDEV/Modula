/**
 * GlobalEffects — intentionally empty.
 *
 * The previous design layered eight decorative FX surfaces over every
 * page (circuit grid, mesh gradient, scanline sweep, three orbs, etc).
 * The Jamie-style overhaul replaces that with a clean white canvas;
 * accent comes from the headline + product shot, not from ambient FX.
 *
 * Kept as a no-op so layout.tsx doesn't need to be touched if we ever
 * want to reintroduce a single, restrained ambient layer later.
 */
export function GlobalEffects() {
  return null;
}
