"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------
   Digital hex rain — a matrix-style cascade of hex glyphs that
   evokes on-chain data flow. Sized for ambient use behind content.

   Performance notes:
   - Capped at ~30 fps (animation only needs to feel techy, not fluid)
   - DPR clamped to 1.25 (or 1 on mobile)
   - Pauses entirely when the tab is hidden
   - Hidden on <720px where background motion isn't noticed but costs
   ------------------------------------------------------------------ */

const GLYPHS = "0123456789ABCDEF";
const FONT_SIZE = 14;
const COLUMN_WIDTH = 18;
const TRAIL_FADE = 0.1;
const HEAD_COLOR = "rgba(47, 107, 255, 0.95)";
const BODY_COLOR_BASE = "rgba(0, 82, 255, ";
const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;

type Column = {
  y: number;
  speed: number;
  length: number;
  counter: number;
  nextChar: number;
  lastChar: string;
};

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Skip entirely on narrow screens — canvas cost without visual payoff
    const isSmall = window.innerWidth < 720;
    if (isSmall) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let columns: Column[] = [];
    let lastFrame = 0;
    let paused = document.hidden;

    const pickGlyph = () =>
      GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);

    function seed() {
      const cols = Math.max(1, Math.ceil(width / COLUMN_WIDTH));
      columns = new Array(cols).fill(0).map(() => ({
        y: -Math.random() * height,
        speed: 0.6 + Math.random() * 1.4,
        length: 8 + Math.floor(Math.random() * 22),
        counter: 0,
        nextChar: 3 + Math.floor(Math.random() * 5),
        lastChar: pickGlyph(),
      }));
    }

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      // Lower DPR ceiling — hex rain doesn't need sub-pixel sharpness
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.font = `600 ${FONT_SIZE}px var(--font-mono), ui-monospace, Menlo, Consolas, monospace`;
      ctx!.textBaseline = "top";
      seed();
      ctx!.clearRect(0, 0, width, height);
    }

    function tick(now: number) {
      if (paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (now - lastFrame < FRAME_MS) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrame = now;

      ctx!.fillStyle = `rgba(250, 251, 255, ${TRAIL_FADE})`;
      ctx!.fillRect(0, 0, width, height);

      for (let i = 0; i < columns.length; i++) {
        const c = columns[i];
        const x = i * COLUMN_WIDTH + 2;

        c.y += c.speed;
        c.counter += 1;
        if (c.counter >= c.nextChar) {
          c.lastChar = pickGlyph();
          c.counter = 0;
          c.nextChar = 3 + Math.floor(Math.random() * 6);
        }

        ctx!.fillStyle = BODY_COLOR_BASE + "0.18)";
        ctx!.fillText(c.lastChar, x, c.y);

        ctx!.fillStyle = HEAD_COLOR;
        ctx!.fillText(c.lastChar, x, c.y);

        if (c.y > height + c.length * FONT_SIZE) {
          c.y = -Math.random() * 200 - 50;
          c.speed = 0.6 + Math.random() * 1.4;
          c.length = 8 + Math.floor(Math.random() * 22);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function onVisibility() {
      paused = document.hidden;
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) {
      ctx!.fillStyle = "rgba(250, 251, 255, 1)";
      ctx!.fillRect(0, 0, width, height);
      for (let i = 0; i < columns.length; i++) {
        const x = i * COLUMN_WIDTH + 2;
        const y = Math.random() * height;
        ctx!.fillStyle = BODY_COLOR_BASE + "0.16)";
        ctx!.fillText(pickGlyph(), x, y);
      }
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fx-canvas"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
