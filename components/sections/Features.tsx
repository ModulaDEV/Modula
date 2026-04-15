"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { FEATURES } from "@/data/features";

export function Features() {
  return (
    <section id="features" className="section">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">
              <span className="dot" />
              Protocol pillars
            </span>
            <h2 className="section-title">Everything the agent era needs.</h2>
            <p className="section-sub">
              Modula is not a platform with a listing fee and an approval
              process. It is a set of public, composable primitives that
              together make AI models tradable, callable, and priced by real
              usage.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {FEATURES.map(({ title, body, Icon }, i) => (
            <Reveal key={title} delay={i * 55}>
              <motion.article
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="card"
                style={{
                  padding: "1.5rem 1.6rem",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--brand-soft)",
                    border: "1px solid var(--brand-border)",
                    color: "var(--brand)",
                  }}
                >
                  <Icon size={18} strokeWidth={1.6} />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--ink-60)",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {body}
                </p>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
