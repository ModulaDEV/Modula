"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { MODELS } from "@/data/models";
import { siteConfig } from "@/site.config";

function Sparkline({ points }: { points: readonly number[] }) {
  const w = 80;
  const h = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const step = w / (points.length - 1);
  const d = points
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} aria-hidden="true">
      <motion.path
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        d={d}
        fill="none"
        stroke="#0052ff"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Registry() {
  return (
    <section id="registry" className="section">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">
              <span className="dot" />
              Registry preview
            </span>
            <h2 className="section-title">
              A live, on-chain index of fine-tunes.
            </h2>
            <p className="section-sub">
              Browse the registry the way an agent would — by capability, by
              base model, by call price, by bonding-curve momentum. Every row
              below is a real ERC-7527 model token with its own MCP endpoint.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="card"
            style={{
              padding: 0,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.85rem 1rem",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-soft)",
              }}
            >
              <Search size={14} style={{ color: "var(--ink-40)" }} />
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--ink-40)",
                }}
              >
                registry.search(type, base, capability) · 1,248 models indexed
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Link
                  href={siteConfig.registryPath}
                  className="btn btn-sm btn-ghost"
                  style={{ fontSize: 12 }}
                >
                  Open registry <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  minWidth: 720,
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      color: "var(--ink-40)",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      Model
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      Type
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      Base
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      Calls
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      USDC / call
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      Curve
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((m, i) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        delay: 0.05 + i * 0.08,
                        duration: 0.35,
                      }}
                      style={{
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div
                          className="mono"
                          style={{
                            fontSize: 11,
                            color: "var(--ink-40)",
                            marginTop: 2,
                          }}
                        >
                          {m.id}
                        </div>
                      </td>
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <span className="chip">{m.type}</span>
                      </td>
                      <td
                        className="mono"
                        style={{
                          padding: "0.9rem 1rem",
                          color: "var(--ink-80)",
                          fontSize: 12.5,
                        }}
                      >
                        {m.base}
                      </td>
                      <td
                        style={{
                          padding: "0.9rem 1rem",
                          color: "var(--ink-80)",
                        }}
                      >
                        {m.calls}
                      </td>
                      <td
                        className="mono"
                        style={{
                          padding: "0.9rem 1rem",
                          color: "var(--ink-80)",
                          fontSize: 12.5,
                        }}
                      >
                        ${m.price}
                      </td>
                      <td
                        style={{
                          padding: "0.9rem 1rem",
                          color: "var(--base-blue-600)",
                          fontWeight: 600,
                        }}
                      >
                        {m.curveMultiplier}
                      </td>
                      <td style={{ padding: "0.6rem 1rem" }}>
                        <Sparkline points={m.trend} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
