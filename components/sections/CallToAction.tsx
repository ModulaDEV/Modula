"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Github, Twitter } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { siteConfig } from "@/site.config";

export function CallToAction() {
  return (
    <section id="cta" className="section">
      <div className="container">
        <Reveal>
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 24,
              padding: "clamp(2.5rem, 6vw, 4.5rem) clamp(1.5rem, 4vw, 3rem)",
              background:
                "linear-gradient(135deg, #0047e0 0%, #0052ff 45%, #2f6bff 100%)",
              color: "#fff",
              textAlign: "center",
              boxShadow:
                "0 30px 60px -24px rgba(0, 82, 255, 0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12), transparent 55%)",
                pointerEvents: "none",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                maskImage:
                  "radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 80%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.85rem",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.08)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
                Live on Base · {siteConfig.launchYear}
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.9rem, 4vw, 3.1rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.08,
                  margin: "1rem auto 1rem",
                  maxWidth: "22ch",
                }}
              >
                Register a model. Or build an agent that uses one.
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.82)",
                  fontSize: "1.0625rem",
                  lineHeight: 1.6,
                  maxWidth: "46rem",
                  margin: "0 auto 2rem",
                }}
              >
                Modula is open, permissionless, and live. No waitlist. No form.
                Clone the repo, wire up your endpoint, or point your agent at
                the registry and start calling models in a minute.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={siteConfig.docsPath}
                  className="btn"
                  style={{
                    background: "#fff",
                    color: "#0047e0",
                    borderColor: "#fff",
                    fontWeight: 600,
                  }}
                >
                  Start with the docs <ArrowUpRight size={15} />
                </Link>
                <a
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: "transparent",
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.5)",
                  }}
                >
                  <Github size={15} /> GitHub
                </a>
                <a
                  href={siteConfig.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: "transparent",
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.5)",
                  }}
                >
                  <Twitter size={15} /> Follow @modulabase
                </a>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
