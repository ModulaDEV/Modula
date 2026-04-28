"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { siteConfig } from "@/site.config";
import { useToast } from "@/components/Toast";

const easeOut = [0.2, 0.7, 0.2, 1] as const;

/**
 * Headline copy is split into a static array of fragments so the
 * typing animation can interpolate one character per tick across the
 * entire headline including the line break, rather than typing each
 * line independently.
 */
const HEADLINE = "Permissionless AI,\non‑chain.";

/**
 * Placeholder until the $MODULA token launches and a real CA exists
 * on Base mainnet. Length matches a real EVM address so the button
 * width doesn't shift when the value is swapped in later.
 */
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Three MCP `tools/call` payloads the terminal cycles through to
 * convey 'this is a live, repeatable protocol surface, not a one-shot
 * screenshot'. Each one is a real, valid MCP envelope that the
 * deployed gateway would accept; only the prompt argument differs.
 */
const TERMINAL_FRAMES: ReadonlyArray<{ url: string; body: string }> = [
  {
    url: "modulabase.org/m/echo‑test/mcp",
    body: `POST /m/0xd619…387B/mcp
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
{ "result": { "echo": "hello, modula" } }`,
  },
  {
    url: "modulabase.org/m/solidity‑audit‑v3/mcp",
    body: `POST /m/0x4a7f…b12c/mcp
Content-Type: application/json
PAYMENT-SIGNATURE: 0x9c1e…a3

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "solidity-audit-v3",
    "arguments": {
      "contract": "Vault.sol",
      "checks": ["reentrancy", "overflow"]
    }
  }
}

→ 200 OK
PAYMENT-RESPONSE: settled · 0.0021 USDC
{ "result": { "findings": 2, "severity": "low" } }`,
  },
  {
    url: "modulabase.org/m/medical‑triage‑lora/mcp",
    body: `POST /m/0x1d90…e847/mcp
Content-Type: application/json
PAYMENT-SIGNATURE: 0x3f82…4d

{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "medical-triage-lora",
    "arguments": {
      "symptoms": ["chest pain", "shortness of breath"]
    }
  }
}

→ 200 OK
PAYMENT-RESPONSE: settled · 0.0034 USDC
{ "result": { "urgency": "high", "route": "ER" } }`,
  },
];

/**
 * Hook — types `target` one character at a time, returns the
 * currently-visible substring. Runs forward to completion in
 * `durationMs`, then yields control. Caller composes multiple
 * instances for cycling animations.
 */
function useTypewriter(target: string, durationMs: number, startDelay = 0) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const total = target.length;
    const tick = total > 0 ? durationMs / total : durationMs;
    const start = setTimeout(() => {
      const id = setInterval(() => {
        if (cancelled) return;
        i += 1;
        setOut(target.slice(0, i));
        if (i >= total) clearInterval(id);
      }, tick);
    }, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(start);
      setOut("");
    };
  }, [target, durationMs, startDelay]);
  return out;
}

export function Hero() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [frame, setFrame] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding">("typing");

  // Cycle terminal frames: type for ~3.2s, hold for ~3s, advance.
  useEffect(() => {
    if (phase === "typing") {
      const t = setTimeout(() => setPhase("holding"), 3200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setFrame((f) => (f + 1) % TERMINAL_FRAMES.length);
      setPhase("typing");
    }, 3000);
    return () => clearTimeout(t);
  }, [phase, frame]);

  const headline = useTypewriter(HEADLINE, 1100, 200);
  const headlineDone = headline.length === HEADLINE.length;

  const current = TERMINAL_FRAMES[frame];
  const typedBody = useTypewriter(
    current.body,
    phase === "typing" ? 3200 : 0,
    0,
  );
  const bodyDone = typedBody.length === current.body.length;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      toast.show("Contract address copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.show("Copy failed — select manually");
    }
  };

  const headlineDisplay = headline
    .split("\n")
    .map((l, i, arr) => (
      <span key={i}>
        {l}
        {i < arr.length - 1 && <br />}
      </span>
    ));

  return (
    <section id="top" className="hero">
      <div className="container hero-inner">
        <div className="hero-stack">
          <h1 className="hero-headline" aria-label="Permissionless AI, on-chain.">
            {headlineDisplay}
            <span
              className="hero-caret"
              data-blink={headlineDone ? "true" : "false"}
              aria-hidden="true"
            />
          </h1>

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: headlineDone ? 1 : 0, y: headlineDone ? 0 : 8 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            Every model, <em>tokenized</em>.<br />
            Every call, <em>settled</em>.<br />
            Every agent, <em>permissionless</em>.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: headlineDone ? 1 : 0, y: headlineDone ? 0 : 8 }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          >
            <Link href={siteConfig.registryPath} className="hero-btn hero-btn-primary">
              Register a model
            </Link>
            <a href="#how" className="hero-btn hero-btn-ghost">
              <Play size={13} fill="currentColor" />
              See how it works
            </a>
          </motion.div>

          <motion.button
            type="button"
            onClick={onCopy}
            className="hero-ca"
            aria-label="Copy contract address"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: headlineDone ? 1 : 0, y: headlineDone ? 0 : 6 }}
            transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
          >
            <span className="hero-ca-label">CA</span>
            <span className="hero-ca-value">{CONTRACT_ADDRESS}</span>
            <span className="hero-ca-icon" data-copied={copied ? "true" : "false"}>
              {copied ? (
                <Check size={13} strokeWidth={2.6} />
              ) : (
                <Copy size={13} strokeWidth={2} />
              )}
            </span>
          </motion.button>

          <motion.p
            className="hero-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: headlineDone ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
          >
            v0.11.0 &nbsp;·&nbsp; Devnet / Testnet &nbsp;·&nbsp; mainnet soon
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: easeOut }}
        className="hero-shot-wrap"
        aria-hidden="true"
      >
        <div className="hero-shot">
          <div className="hero-shot-chrome">
            <span className="dot dot-r" />
            <span className="dot dot-y" />
            <span className="dot dot-g" />
            <span className="hero-shot-url" key={current.url}>
              {current.url}
            </span>
          </div>
          <pre className="hero-shot-code">
            <code>
              {typedBody}
              <span
                className="hero-shot-caret"
                data-active={bodyDone ? "false" : "true"}
              />
            </code>
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
          min-height: 1.92em;
        }
        .hero-caret {
          display: inline-block;
          width: 0.06em;
          height: 0.85em;
          margin-left: 0.04em;
          vertical-align: -0.08em;
          background: var(--base-blue);
          border-radius: 1px;
          opacity: 1;
        }
        .hero-caret[data-blink="true"] {
          animation: hero-caret-blink 1.05s step-end infinite;
        }
        @keyframes hero-caret-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
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

        .hero-ca {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px 8px 14px;
          border-radius: 999px;
          background: rgba(11, 16, 32, 0.04);
          border: 1px solid rgba(11, 16, 32, 0.08);
          color: rgba(11, 16, 32, 0.78);
          font-family: var(--font-mono);
          font-size: 12.5px;
          letter-spacing: 0;
          cursor: pointer;
          transition:
            background 0.18s var(--ease-out),
            border-color 0.18s var(--ease-out),
            transform 0.15s var(--ease-out);
          margin-top: 0.4rem;
          max-width: 100%;
          overflow: hidden;
        }
        .hero-ca:hover {
          background: rgba(11, 16, 32, 0.07);
          border-color: rgba(11, 16, 32, 0.16);
        }
        .hero-ca:active {
          transform: scale(0.985);
        }
        .hero-ca-label {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--base-blue);
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(0, 82, 255, 0.10);
          font-family: var(--font-sans);
        }
        .hero-ca-value {
          color: rgba(11, 16, 32, 0.7);
          font-feature-settings: "tnum" 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 60vw;
        }
        .hero-ca-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(11, 16, 32, 0.06);
          color: rgba(11, 16, 32, 0.6);
          transition: background 0.2s var(--ease-out), color 0.2s var(--ease-out);
        }
        .hero-ca:hover .hero-ca-icon {
          background: rgba(11, 16, 32, 0.1);
          color: var(--ink);
        }
        .hero-ca-icon[data-copied="true"] {
          background: var(--base-blue);
          color: #fff;
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
          opacity: 0;
          animation: hero-shot-url-in 0.32s var(--ease-out) forwards;
        }
        @keyframes hero-shot-url-in {
          from { opacity: 0; transform: translateY(-2px); }
          to   { opacity: 1; transform: translateY(0); }
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
          min-height: 21em;
        }
        .hero-shot-caret {
          display: inline-block;
          width: 0.55ch;
          height: 1.1em;
          vertical-align: -0.18em;
          background: rgba(255, 255, 255, 0.7);
          margin-left: 1px;
          opacity: 0;
        }
        .hero-shot-caret[data-active="true"] {
          opacity: 0.9;
          animation: hero-shot-caret-blink 0.85s step-end infinite;
        }
        @keyframes hero-shot-caret-blink {
          0%, 50% { opacity: 0.9; }
          51%, 100% { opacity: 0; }
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
          .hero-ca-value { font-size: 11px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-caret,
          .hero-shot-caret { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
