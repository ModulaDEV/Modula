"use client";

import { motion } from "framer-motion";
import { TrendingUp, Coins, Flame, Users } from "lucide-react";
import { Reveal } from "@/components/Reveal";

function BondingCurveSVG() {
  return (
    <svg viewBox="0 0 600 320" style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0052ff" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#0052ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="curve-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5e8bff" />
          <stop offset="100%" stopColor="#0047e0" />
        </linearGradient>
      </defs>

      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={i}
          x1={50}
          x2={580}
          y1={40 + i * 44}
          y2={40 + i * 44}
          stroke="rgba(11,16,32,0.06)"
          strokeWidth="1"
        />
      ))}

      <motion.path
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8 }}
        d="M 50 280
           C 160 275, 220 260, 280 225
           C 340 185, 400 140, 460 95
           C 500 65, 540 55, 580 48
           L 580 280 Z"
        fill="url(#curve-fill)"
      />

      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        d="M 50 280
           C 160 275, 220 260, 280 225
           C 340 185, 400 140, 460 95
           C 500 65, 540 55, 580 48"
        fill="none"
        stroke="url(#curve-line)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {[
        { cx: 110, cy: 277, label: "t=0 · mint" },
        { cx: 280, cy: 225, label: "first agents" },
        { cx: 430, cy: 108, label: "demand builds" },
        { cx: 568, cy: 50, label: "top of curve" },
      ].map((p, i) => (
        <motion.g
          key={p.label}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: 0.3 + i * 0.18, duration: 0.4 }}
        >
          <circle
            cx={p.cx}
            cy={p.cy}
            r="7"
            fill="#fff"
            stroke="#0052ff"
            strokeWidth="2.5"
          />
          <circle cx={p.cx} cy={p.cy} r="3" fill="#0052ff" />
          <text
            x={p.cx}
            y={p.cy - 14}
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="rgba(11,16,32,0.62)"
            textAnchor="middle"
            style={{ letterSpacing: "0.04em" }}
          >
            {p.label}
          </text>
        </motion.g>
      ))}

      <text
        x={50}
        y={300}
        fontSize="10"
        fill="rgba(11,16,32,0.42)"
        fontFamily="var(--font-mono)"
        style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
      >
        Inference calls →
      </text>
      <text
        x={50}
        y={30}
        fontSize="10"
        fill="rgba(11,16,32,0.42)"
        fontFamily="var(--font-mono)"
        style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
      >
        Token price ↑
      </text>
    </svg>
  );
}

const PILLARS = [
  {
    Icon: TrendingUp,
    title: "Price signal",
    body: "Every call settles into the curve. The token price is a running, on-chain quality score no reviewer can fake.",
  },
  {
    Icon: Coins,
    title: "Creator treasury",
    body: "Each model has an on-chain treasury. Inference revenue and curve proceeds flow to the creator, not the protocol.",
  },
  {
    Icon: Users,
    title: "Early discoverers win",
    body: "Holders who back a model before it goes viral capture the curve. Discovery itself becomes an investable act.",
  },
  {
    Icon: Flame,
    title: "No dilution",
    body: "Supply is pinned by the ERC-7527 curve — no team unlock, no infinite mint, no treasury that can drain the market.",
  },
];

export function Economics() {
  return (
    <section id="economics" className="section">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">
              <span className="dot" />
              Economics
            </span>
            <h2 className="section-title">
              Bonding curves turn{" "}
              <span className="gradient-text">usage into price</span>.
            </h2>
            <p className="section-sub">
              Modula uses ERC-7527 to give every model a deterministic token
              curve. Inference demand writes directly into the curve, so a
              model&apos;s token price is its quality — continuously, publicly,
              unforgeably.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gap: "2rem",
            gridTemplateColumns: "1.2fr 1fr",
            alignItems: "center",
          }}
          className="econ-grid"
        >
          <Reveal>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="card card-glow"
              style={{ padding: "1.5rem 1.5rem 1rem", borderRadius: 18 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--ink-40)",
                    fontWeight: 600,
                  }}
                >
                  ERC-7527 bonding curve
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--base-blue-600)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  live signal
                </div>
              </div>
              <BondingCurveSVG />
            </motion.div>
          </Reveal>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {PILLARS.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div
                  style={{
                    display: "flex",
                    gap: "0.9rem",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--brand-soft)",
                      border: "1px solid var(--brand-border)",
                      color: "var(--brand)",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Icon size={17} strokeWidth={1.6} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        marginBottom: 3,
                      }}
                    >
                      {title}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--ink-60)",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                      }}
                    >
                      {body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .econ-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
