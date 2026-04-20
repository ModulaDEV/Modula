import { AnimatedBackground } from "@/components/AnimatedBackground";

export function GlobalEffects() {
  return (
    <div className="fx-root" aria-hidden="true">
      <div className="fx-mesh" />
      <div className="fx-grid" />
      <div className="fx-circuit" />
      <div className="fx-canvas-wrap">
        <AnimatedBackground />
      </div>
      <div className="fx-scanline" />
      <div className="fx-gradient" />
      <div className="fx-orb fx-orb-1" />
      <div className="fx-orb fx-orb-2" />
      <div className="fx-orb fx-orb-3" />
      <div className="fx-noise" />
      <div className="fx-vignette" />
    </div>
  );
}
