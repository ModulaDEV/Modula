"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { STATS } from "@/data/stats";

export function Stats() {
  return (
    <section id="stats" className="section" style={{ paddingTop: "1rem" }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {STATS.map((s, i) => (
            <Reveal key={s.k} delay={i * 60}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="card card-glow"
                style={{
                  padding: "1.6rem 1.7rem",
                  borderRadius: 18,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 140,
                    height: 140,
                    background:
                      "radial-gradient(circle at 70% 30%, rgba(0,82,255,0.12), transparent 60%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  className="gradient-text"
                  style={{
                    fontSize: "clamp(1.9rem, 3.4vw, 2.55rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    marginBottom: "0.6rem",
                    position: "relative",
                  }}
                >
                  {s.k}
                </div>
                <div
                  style={{
                    fontSize: 14.5,
                    color: "var(--ink)",
                    fontWeight: 600,
                    marginBottom: "0.3rem",
                    letterSpacing: "-0.005em",
                    position: "relative",
                  }}
                >
                  {s.line}
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--ink-60)",
                    fontSize: 13,
                    lineHeight: 1.6,
                    position: "relative",
                  }}
                >
                  {s.sub}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
