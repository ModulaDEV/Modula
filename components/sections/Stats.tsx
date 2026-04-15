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
                style={{ padding: "1.5rem 1.6rem", borderRadius: 16 }}
              >
                <div
                  style={{
                    fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    color: "var(--ink)",
                    lineHeight: 1,
                    marginBottom: "0.55rem",
                  }}
                >
                  {s.k}
                </div>
                <div
                  style={{
                    fontSize: 14.5,
                    color: "var(--ink)",
                    fontWeight: 500,
                    marginBottom: "0.25rem",
                  }}
                >
                  {s.line}
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--ink-60)",
                    fontSize: 13,
                    lineHeight: 1.55,
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
