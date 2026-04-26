"use client";

import { useEffect, useRef } from "react";

/**
 * Renders the `.fx-circuit` layer (the dotted PCB-trace overlay in the
 * page background) and continuously animates a small parallax offset
 * on it driven by:
 *
 *   - vertical scroll position (slow upward drift as the user scrolls)
 *   - cursor position           (gentle pull toward the cursor)
 *
 * The component owns a single requestAnimationFrame loop that lerps a
 * 'current' offset toward a 'target' offset and writes the result into
 * two CSS custom properties on its own root:
 *
 *     --fx-px   horizontal pixel offset
 *     --fx-py   vertical pixel offset
 *
 * The `.fx-circuit` rule in `globals.css` reads these via translate3d
 * so the actual painting is GPU-composited and never reflows.
 *
 * Reduced motion: if the OS flag is set, the listeners are not bound
 * and the layer renders pinned at the origin.
 */
export function FxCircuitParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = ref.current;
    if (!node) return;

    // Maximum offsets — kept conservative so the effect feels like
    // depth, not motion sickness.
    const MAX_MOUSE_X = 22;
    const MAX_MOUSE_Y = 16;
    const SCROLL_FACTOR = -0.06; // negative = layer scrolls *up* as page goes down
    const LERP = 0.08;

    let mouseTargetX = 0;
    let mouseTargetY = 0;
    let scrollOffset = 0;

    let curX = 0;
    let curY = 0;

    let raf = 0;

    const onMouseMove = (e: MouseEvent) => {
      // Normalise cursor to [-1, 1] across the viewport.
      const nx = (e.clientX / window.innerWidth)  * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseTargetX = nx * MAX_MOUSE_X;
      mouseTargetY = ny * MAX_MOUSE_Y;
    };

    const onScroll = () => {
      scrollOffset = window.scrollY * SCROLL_FACTOR;
    };

    const tick = () => {
      curX += (mouseTargetX - curX) * LERP;
      curY += (mouseTargetY - curY) * LERP;
      node.style.setProperty("--fx-px", `${curX.toFixed(2)}px`);
      node.style.setProperty("--fx-py", `${(curY + scrollOffset).toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll",    onScroll,    { passive: true });
    onScroll();                                    // seed initial value
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll",    onScroll);
    };
  }, []);

  return <div ref={ref} className="fx-circuit" aria-hidden="true" />;
}
