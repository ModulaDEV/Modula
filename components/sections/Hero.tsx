"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Github, Terminal } from "lucide-react";
import { siteConfig } from "@/site.config";

const easeOut = [0.2, 0.7, 0.2, 1] as const;

export function Hero() {
  return (
    <section
      id="top"
      className="section hero-section"
      style={{ paddingBlock: "clamp(3.5rem, 8vw, 6rem)" }}
    >
      <div className="container">
        <div className="hero-grid">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "1.25rem",
            }}
          >
            <span className="kicker">
              <span className="dot" />
              Permissionless AI on Base · ERC-7527
            </span>

            <h1
              style={{
                fontSize: "clamp(2.4rem, 6vw, 4.4rem)",
                fontWeight: 600,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                margin: 0,
                maxWidth: "22ch",
                textWrap: "balance",
              }}
            >
              The tokenized{" "}
              <span className="gradient-text">AI model registry</span> for the
              agent era.
            </h1>

            <p
              style={{
                color: "var(--ink-60)",
                fontSize: "clamp(1.05rem, 1.4vw, 1.2rem)",
                maxWidth: "56ch",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              Modula lets anyone register a fine-tuned model on-chain. Each model
              exposes an MCP endpoint so agents can call it as a tool.
              Pay-per-inference settles through x402. A bonding curve prices
              every model by real demand — no gatekeepers, no API keys, no cut.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: "0.5rem",
              }}
            >
              <Link href={siteConfig.docsPath} className="btn btn-primary">
                Read the whitepaper
                <ArrowUpRight size={15} />
              </Link>
              <Link href={siteConfig.registryPath} className="btn">
                <Terminal size={15} /> Explore the registry
              </Link>
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                <Github size={15} /> View on GitHub
              </a>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.6rem",
                marginTop: "0.25rem",
              }}
              aria-label="Protocol stack"
            >
              <span className="chip">chain: Base</span>
              <span className="chip">standard: ERC-7527</span>
              <span className="chip">payments: x402</span>
              <span className="chip">agents: MCP</span>
              <span className="chip">license: MIT</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.2, ease: easeOut }}
            className="hero-visual"
            aria-hidden="true"
          >
            <HeroOrbital />
          </motion.div>
        </div>
      </div>

      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: center;
          position: relative;
        }
        .hero-visual {
          position: relative;
          aspect-ratio: 1 / 1;
          width: 100%;
          max-width: 520px;
          justify-self: end;
        }
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr;
          }
          .hero-visual {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------------------------------------------
   Decorative orbital — concentric rings + orbiting stack chips
   Renders only the existing protocol stack tokens (no new content).
   ------------------------------------------------------------------ */
function HeroOrbital() {
  const rings = [
    { r: 42, opacity: 0.2 },
    { r: 62, opacity: 0.16 },
    { r: 84, opacity: 0.12 },
    { r: 108, opacity: 0.08 },
  ];
  const satellites = [
    { label: "Base", angle: -20 },
    { label: "ERC-7527", angle: 55 },
    { label: "x402", angle: 145 },
    { label: "MCP", angle: 230 },
  ];

  const center = 50; // percent
  const orbitR = 38; // percent

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {/* SVG concentric rings */}
      <svg
        viewBox="-140 -140 280 280"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          <radialGradient id="core-grad" cx="0" cy="0" r="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#2f6bff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0052ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="halo-grad" cx="0" cy="0" r="1">
            <stop offset="0%" stopColor="#0052ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0052ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0052ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5e8bff" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Halo */}
        <circle cx="0" cy="0" r="135" fill="url(#halo-grad)" />

        {/* Rings */}
        {rings.map((ring, i) => (
          <motion.circle
            key={i}
            cx="0"
            cy="0"
            r={ring.r}
            fill="none"
            stroke="url(#ring-grad)"
            strokeOpacity={ring.opacity * 4}
            strokeWidth={0.8}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.25 + i * 0.1 }}
          />
        ))}

        {/* Dashed orbit */}
        <motion.circle
          cx="0"
          cy="0"
          r="108"
          fill="none"
          stroke="#0052ff"
          strokeOpacity="0.25"
          strokeWidth="1"
          strokeDasharray="4 6"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "0 0" }}
        />

        {/* Core */}
        <motion.circle
          cx="0"
          cy="0"
          r="28"
          fill="url(#core-grad)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.92, 1, 0.92],
            opacity: 1,
          }}
          transition={{
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.6 },
          }}
          style={{ transformOrigin: "0 0" }}
        />
        <circle cx="0" cy="0" r="10" fill="#ffffff" fillOpacity="0.9" />
      </svg>

      {/* Orbiting chips */}
      {satellites.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        const x = center + Math.cos(rad) * orbitR;
        const y = center + Math.sin(rad) * orbitR;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.12 }}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <motion.span
              className="chip"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 4 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
              style={{
                willChange: "transform",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 26px -14px rgba(0,82,255,0.5)",
              }}
            >
              {s.label}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
