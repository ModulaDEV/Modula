"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  UploadCloud,
  Boxes,
  Bot,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    Icon: BrainCircuit,
    title: "Fine-tune",
    body: "A creator trains a LoRA, adapter, or small specialized model on a domain they know better than anyone else.",
  },
  {
    n: "02",
    Icon: UploadCloud,
    title: "Register on-chain",
    body: "The creator registers the model via ERC-7527. A bonding-curve token is minted and an MCP endpoint is generated.",
  },
  {
    n: "03",
    Icon: Boxes,
    title: "Indexed in the registry",
    body: "The model becomes discoverable on-chain. Any indexer, app, or agent can read it — no platform account required.",
  },
  {
    n: "04",
    Icon: Bot,
    title: "Called by agents",
    body: "Agents discover the MCP endpoint, sign an x402 payment, and call the model as a tool. Demand pushes the curve — price is quality.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="protocol" className="section">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">
              <span className="dot" />
              How it works
            </span>
            <h2 className="section-title">
              Four primitives. One on-chain loop.
            </h2>
            <p className="section-sub">
              Modula turns a fine-tuned model into a priced, callable, on-chain
              object. The entire lifecycle — from registration to agent call to
              price discovery — happens natively on Base.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            alignItems: "stretch",
          }}
        >
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="card"
                style={{
                  padding: "1.6rem 1.5rem",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.9rem",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    fontSize: "3.6rem",
                    fontWeight: 700,
                    color: "rgba(0, 82, 255, 0.07)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  {s.n}
                </div>

                <div
                  style={{
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    background: "var(--brand-soft)",
                    border: "1px solid var(--brand-border)",
                    color: "var(--brand)",
                  }}
                >
                  <s.Icon size={20} strokeWidth={1.6} />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--ink-40)",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Step {s.n}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {s.title}
                  </h3>
                </div>

                <p
                  style={{
                    margin: 0,
                    color: "var(--ink-60)",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {s.body}
                </p>

                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      right: 10,
                      bottom: 10,
                      color: "var(--ink-20)",
                    }}
                  >
                    <ArrowRight size={14} />
                  </div>
                )}
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
