"use client";

import { useState } from "react";

// ERC-7527 linear curve parameters (spec: tech-updates U6).
// price(supply) = BASE + SLOPE * supply, denominated in USDC.
const BASE      = 0.01;
const SLOPE     = 0.0001;
// Fraction of every call's USDC fee that gets routed through the curve
// (mints new tokens and pushes price along the slope).
const FEE_RATIO = 0.05;
// Per-call inference fee assumed for the projection. Real models charge
// per-tool, this is a simulator default that gives creators a feel for
// scale without us guessing model-specific pricing.
const FEE_USDC  = 0.10;

function priceAt(supply: number): number {
  return BASE + SLOPE * supply;
}

function project(supply: number, callsPerDay: number, days: number): number {
  const totalUsdc = callsPerDay * days * FEE_USDC;
  const toCurve   = totalUsdc * FEE_RATIO;
  const newTokens = Math.floor(toCurve / priceAt(supply));
  return priceAt(supply + newTokens);
}

interface Props {
  /** Current curve supply for this model (0 if no activity yet). */
  supply: number;
}

export function CurveSimulator({ supply }: Props) {
  const [calls, setCalls] = useState(100);

  const now = priceAt(supply);
  const p30 = project(supply, calls, 30);
  const p90 = project(supply, calls, 90);

  const pct = (next: number) => {
    if (now <= 0) return "—";
    const delta = ((next - now) / now) * 100;
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: "var(--ink-60)" }}>
          Drag to project price impact at different call volumes.
        </div>
        <div className="mono" style={{ fontSize: 14, color: "var(--ink-80)", fontVariantNumeric: "tabular-nums" }}>
          <span style={{ fontWeight: 600 }}>{calls.toLocaleString()}</span>
          <span style={{ color: "var(--ink-40)", marginLeft: 6 }}>calls / day</span>
        </div>
      </div>

      <input
        type="range"
        min={1}
        max={10000}
        step={1}
        value={calls}
        onChange={(e) => setCalls(Number(e.target.value))}
        aria-label="Calls per day"
        style={{
          width: "100%",
          marginTop: "0.75rem",
          accentColor: "#0052ff",
          cursor: "pointer",
        }}
      />

      <div
        style={{
          display: "grid",
          gap: "0.6rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          marginTop: "1.25rem",
        }}
      >
        <Projection label="Now"        price={now} pct={null}     />
        <Projection label="In 30 days" price={p30} pct={pct(p30)} />
        <Projection label="In 90 days" price={p90} pct={pct(p90)} />
      </div>

      <div style={{ marginTop: "1rem", fontSize: 11, color: "var(--ink-40)" }}>
        Linear ERC-7527 curve · base ${BASE.toFixed(4)} + slope ${SLOPE.toFixed(4)}/token · {(FEE_RATIO * 100).toFixed(0)}% of fees route to the curve · assumes ${FEE_USDC.toFixed(2)} per call.
      </div>
    </div>
  );
}

function Projection({ label, price, pct }: { label: string; price: number; pct: string | null }) {
  return (
    <div
      style={{
        padding: "0.85rem 1rem",
        borderRadius: 10,
        background: "var(--bg-soft)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--ink-40)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 20,
          fontWeight: 600,
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ${price.toFixed(4)}
      </div>
      {pct && (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: pct.startsWith("+") ? "#16a34a" : "var(--ink-60)",
            marginTop: 2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}
        </div>
      )}
    </div>
  );
}
