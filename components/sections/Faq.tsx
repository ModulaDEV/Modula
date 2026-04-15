"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { FAQ } from "@/data/faq";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section">
      <div className="container-narrow">
        <Reveal>
          <div className="section-head">
            <span className="kicker">
              <span className="dot" />
              FAQ
            </span>
            <h2 className="section-title">
              Protocol questions, answered directly.
            </h2>
            <p className="section-sub">
              No hedging. Modula is a small number of simple ideas — here is
              exactly what we mean when we say any of them.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div
            className="card"
            style={{
              padding: 0,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {FAQ.map((f, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={f.q}
                  style={{
                    borderBottom:
                      i < FAQ.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      padding: "1.15rem 1.35rem",
                      background: isOpen
                        ? "var(--brand-softer)"
                        : "transparent",
                      border: "none",
                      textAlign: "left",
                      color: "var(--ink)",
                      fontFamily: "inherit",
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: "-0.005em",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <span>{f.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        color: isOpen ? "var(--brand)" : "var(--ink-40)",
                        background: isOpen
                          ? "var(--brand-soft)"
                          : "transparent",
                        border: `1px solid ${
                          isOpen ? "var(--brand-border)" : "var(--border)"
                        }`,
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={14} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.28,
                          ease: [0.2, 0.7, 0.2, 1],
                        }}
                        style={{ overflow: "hidden" }}
                      >
                        <p
                          style={{
                            margin: 0,
                            padding: "0 1.35rem 1.3rem",
                            color: "var(--ink-60)",
                            fontSize: 14,
                            lineHeight: 1.68,
                            maxWidth: "62ch",
                          }}
                        >
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
