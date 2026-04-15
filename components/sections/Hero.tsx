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
      className="section"
      style={{ paddingBlock: "clamp(3.5rem, 8vw, 6rem)" }}
    >
      <div className="container" style={{ position: "relative" }}>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.2 }}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-6% -2% auto auto",
            width: "min(520px, 45%)",
            aspectRatio: "1 / 1",
            background:
              "radial-gradient(circle at 60% 40%, rgba(0,82,255,0.22), rgba(0,82,255,0) 65%)",
            filter: "blur(10px)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
      </div>
    </section>
  );
}
