"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/site.config";

const easeOut = [0.2, 0.7, 0.2, 1] as const;

export function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-inner">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="hero-stack"
        >
          <h1 className="hero-headline">
            Permissionless AI,
            <br />
            on&#8209;chain.
          </h1>

          <p className="hero-sub">
            Every model, <em>tokenized</em>.<br />
            Every call, <em>settled</em>.<br />
            Every agent, <em>permissionless</em>.
          </p>

          <div className="hero-cta">
            <Link href={siteConfig.registryPath} className="hero-btn hero-btn-primary">
              Register a model
            </Link>
            <a href="#how" className="hero-btn hero-btn-ghost">
              <Play size={13} fill="currentColor" />
              See how it works
            </a>
          </div>

          <p className="hero-meta">
            v0.11.0 &nbsp;·&nbsp; Base Sepolia live &nbsp;·&nbsp; mainnet soon
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.25, ease: easeOut }}
        className="hero-shot-wrap"
        aria-hidden="true"
      >
        <div className="hero-shot">
          <div className="hero-shot-chrome">
            <span className="dot dot-r" />
            <span className="dot dot-y" />
            <span className="dot dot-g" />
            <span className="hero-shot-url">
              modulabase.org/m/echo&#8209;test/mcp
            </span>
          </div>
          <pre className="hero-shot-code">
            <code>{`POST /m/0xd619…387B/mcp
Content-Type: application/json
PAYMENT-SIGNATURE: 0x7a4b…f2

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "echo-test",
    "arguments": { "prompt": "hello, modula" }
  }
}

→ 200 OK
PAYMENT-RESPONSE: settled · 0.001 USDC
{ "result": { "echo": "hello, modula" } }`}</code>
          </pre>
        </div>

        <div className="hero-trust">
          <span className="hero-trust-label">Powered by the open stack</span>
          <span className="hero-trust-mark">ERC&#8209;7527</span>
          <span className="hero-trust-mark">x402</span>
          <span className="hero-trust-mark">MCP&nbsp;2025‑11‑25</span>
          <span className="hero-trust-mark">@Base</span>
        </div>
      </motion.div>

      <style>{`
        .hero {
          position: relative;
          padding-block: clamp(5rem, 11vw, 9rem) 0;
          background: #ffffff;
          overflow: hidden;
        }
        .hero-inner {
          display: flex;
          justify-content: center;
        }
        .hero-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: clamp(1.4rem, 2vw, 2rem);
          max-width: 980px;
        }
        .hero-headline {
          margin: 0;
          color: var(--base-blue);
          font-family: var(--font-display);
          font-size: clamp(2.6rem, 8.4vw, 6.6rem);
          font-weight: 700;
          letter-spacing: -0.045em;
          line-height: 0.96;
          text-wrap: balance;
        }
        .hero-sub {
          margin: 0;
          color: rgba(11, 16, 32, 0.55);
          font-size: clamp(1rem, 1.45vw, 1.22rem);
          line-height: 1.55;
          font-weight: 400;
        }
        .hero-sub em {
          color: var(--base-blue);
          font-style: normal;
          font-weight: 500;
        }
        .hero-cta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 0.4rem;
        }
        .hero-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.78rem 1.25rem;
          border-radius: 999px;
          font-size: 14.5px;
          font-weight: 500;
          letter-spacing: -0.005em;
          transition:
            transform 0.18s var(--ease-out),
            background 0.2s var(--ease-out),
            color 0.2s var(--ease-out),
            box-shadow 0.2s var(--ease-out);
          will-change: transform;
        }
        .hero-btn-primary {
          background: #0b1020;
          color: #ffffff;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset,
            0 10px 24px -14px rgba(11, 16, 32, 0.55);
        }
        .hero-btn-primary:hover {
          background: #000;
          color: #fff;
          transform: translateY(-1px);
        }
        .hero-btn-ghost {
          background: rgba(11, 16, 32, 0.05);
          color: rgba(11, 16, 32, 0.78);
        }
        .hero-btn-ghost:hover {
          background: rgba(11, 16, 32, 0.08);
          color: var(--base-blue);
          transform: translateY(-1px);
        }
        .hero-meta {
          margin: 0.2rem 0 0;
          color: rgba(11, 16, 32, 0.4);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.02em;
        }

        .hero-shot-wrap {
          position: relative;
          margin-top: clamp(3.5rem, 7vw, 6rem);
          padding-inline: 16px;
          background: linear-gradient(180deg, #ffffff 0%, #f4f6fb 100%);
        }
        .hero-shot {
          position: relative;
          width: min(100%, 1080px);
          margin: 0 auto;
          border-radius: 18px;
          overflow: hidden;
          background: linear-gradient(180deg, #0b1020 0%, #060914 100%);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.06) inset,
            0 30px 60px -30px rgba(11, 16, 32, 0.5),
            0 0 0 1px rgba(11, 16, 32, 0.06);
        }
        .hero-shot-chrome {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
        }
        .hero-shot-chrome .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .hero-shot-chrome .dot-r { background: #ff5f56; }
        .hero-shot-chrome .dot-y { background: #ffbd2e; }
        .hero-shot-chrome .dot-g { background: #27c93f; }
        .hero-shot-url {
          margin-left: 8px;
          color: rgba(255, 255, 255, 0.5);
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .hero-shot-code {
          margin: 0;
          padding: clamp(1rem, 2.4vw, 1.8rem) clamp(1.1rem, 3vw, 2.4rem);
          color: rgba(255, 255, 255, 0.86);
          font-family: var(--font-mono);
          font-size: clamp(11.5px, 1.05vw, 13.5px);
          line-height: 1.65;
          white-space: pre;
          overflow-x: auto;
        }

        .hero-trust {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: clamp(1rem, 2.4vw, 2rem);
          padding: clamp(2rem, 4vw, 3rem) 0 clamp(2.5rem, 5vw, 4rem);
          color: rgba(11, 16, 32, 0.42);
        }
        .hero-trust-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .hero-trust-mark {
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: rgba(11, 16, 32, 0.55);
        }

        @media (max-width: 720px) {
          .hero-cta { flex-direction: column; width: 100%; max-width: 320px; }
          .hero-btn { justify-content: center; width: 100%; }
          .hero-shot-code { font-size: 11px; }
        }
      `}</style>
    </section>
  );
}
