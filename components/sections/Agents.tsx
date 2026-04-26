"use client";

import { motion } from "framer-motion";
import { Terminal, Cpu, Plug, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const TERMINAL_LINES: ReadonlyArray<{ k: "cmd" | "out" | "ok"; text: string }> = [
  { k: "cmd", text: "$ agent discover --registry modulabase.org" },
  { k: "out", text: "↳ 1,248 models indexed · 412 MCP endpoints live" },
  { k: "cmd", text: "$ agent use modula:solidity-audit-v3" },
  { k: "out", text: "↳ Endpoint: https://mcp.modulabase.org/m/0x4a7f…b12c" },
  { k: "out", text: "↳ Pricing:  0.0021 USDC / call · x402" },
  { k: "cmd", text: "$ agent call solidity-audit-v3 --input ./contract.sol" },
  { k: "out", text: "↳ x402: signing payment · 0.0021 USDC → 0x4a7f…b12c" },
  { k: "out", text: "↳ Response in 740ms · 3 findings · 1 critical" },
  { k: "ok",  text: "✔ Call settled on Base · tx 0x8c91…e2ad" },
];

const POINTS = [
  {
    Icon: Plug,
    title: "Drop-in MCP tool",
    body: "Any MCP-aware agent — Claude, Cursor, custom — adds a Modula model by pointing at its endpoint. One line, no SDK integration.",
  },
  {
    Icon: Cpu,
    title: "Routed to the best fit",
    body: "Agents can query the registry for models matching a task and route by capability, latency, or bonding-curve-implied quality.",
  },
  {
    Icon: CheckCircle2,
    title: "Verifiably paid",
    body: "Every call is bound to an x402 payment signed by the calling agent. The protocol can prove which agent called which model, and when.",
  },
];

export function Agents() {
  return (
    <section id="agents" className="section">
      <div className="container">
        <div
          style={{
            display: "grid",
            gap: "2.5rem",
            gridTemplateColumns: "1fr 1.15fr",
            alignItems: "center",
          }}
          className="agents-grid"
        >
          <Reveal>
            <div>
              <span className="kicker">
                <span className="dot" />
                Built for AI agents
              </span>
              <h2
                className="section-title"
                style={{ textAlign: "left", marginTop: "0.75rem" }}
              >
                Models as tools.{" "}
                <span className="gradient-text">Paid at the edge.</span>
              </h2>
              <p
                style={{
                  color: "var(--ink-60)",
                  fontSize: 16,
                  lineHeight: 1.65,
                  margin: "0 0 1.5rem",
                  maxWidth: "44ch",
                }}
              >
                Modula is designed for agents, not humans clicking
                &apos;Get API key&apos;. Every registered model is an MCP tool
                with an x402 price tag — discoverable by capability, callable
                by any agent, paid per request in USDC on Base.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {POINTS.map(({ Icon, title, body }, i) => (
                  <Reveal key={title} delay={100 + i * 80}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.9rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        className="icon-tile"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <Icon size={16} strokeWidth={1.6} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14.5,
                            marginBottom: 2,
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
          </Reveal>

          <Reveal delay={80}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
              className="card card-bordered-strong"
              style={{
                padding: 0,
                overflow: "hidden",
                borderRadius: 14,
                background: "#0b1020",
                color: "#e6eaff",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.65rem 0.85rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(230, 234, 255, 0.6)",
                }}
              >
                <Terminal size={13} />
                <span>agent · mcp session</span>
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    gap: 5,
                  }}
                >
                  {[
                    "rgba(255,90,90,0.7)",
                    "rgba(255,200,0,0.7)",
                    "rgba(90,220,130,0.7)",
                  ].map((c) => (
                    <span
                      key={c}
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: c,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                style={{
                  padding: "1rem 1.1rem 1.25rem",
                  fontSize: 12.5,
                  lineHeight: 1.7,
                }}
              >
                {TERMINAL_LINES.map((l, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.25 + i * 0.08,
                      duration: 0.35,
                      ease: "easeOut",
                    }}
                    style={{
                      color:
                        l.k === "cmd"
                          ? "#ffffff"
                          : l.k === "ok"
                            ? "#7cf0a8"
                            : "rgba(230, 234, 255, 0.62)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {l.text}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Reveal>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .agents-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
