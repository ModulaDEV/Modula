"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/site.config";

const easeOut = [0.2, 0.7, 0.2, 1] as const;

const HEADLINE = "Permissionless AI,\non‑chain.";

// Each entry is one line that will be appended to the scrolling log.
// The terminal starts pre-populated and new lines keep arriving.
const LOG_LINES = [
  "$ modula registry list --network base",
  "  echo-test          0xd619…387B  v1.0  ✓ live",
  "  solidity-audit-v3  0x4a7f…b12c  v3.1  ✓ live",
  "  medical-triage     0x1d90…e847  v2.0  ✓ live",
  "",
  "$ modula call 0xd619…387B --prompt 'hello, modula'",
  "POST /m/0xd619…387B/mcp",
  "PAYMENT-SIGNATURE: 0x7a4b…f2",
  "→ 200 OK · settled 0.001 USDC",
  '{ "result": { "echo": "hello, modula" } }',
  "",
  "$ modula call 0x4a7f…b12c --file Vault.sol",
  "POST /m/0x4a7f…b12c/mcp",
  "PAYMENT-SIGNATURE: 0x9c1e…a3",
  "→ 200 OK · settled 0.0021 USDC",
  '{ "result": { "findings": 2, "severity": "low" } }',
  "",
  "$ modula call 0x1d90…e847 --symptoms 'chest pain'",
  "POST /m/0x1d90…e847/mcp",
  "PAYMENT-SIGNATURE: 0x3f82…4d",
  "→ 200 OK · settled 0.0034 USDC",
  '{ "result": { "urgency": "high", "route": "ER" } }',
  "",
  "$ modula register --model ./lora-weights.bin --name sentiment-v1",
  "  Uploading weights…  ████████████████  100%",
  "  Deploying ERC-7527 token…",
  "  tx: 0xab12…9f3e  confirmed in block 18204910",
  "  ✓ sentiment-v1 live at 0x8f3c…aa01",
  "",
  "$ modula call 0x8f3c…aa01 --text 'great product'",
  "POST /m/0x8f3c…aa01/mcp",
  "PAYMENT-SIGNATURE: 0x2b7d…c9",
  "→ 200 OK · settled 0.0008 USDC",
  '{ "result": { "label": "positive", "score": 0.97 } }',
  "",
  "$ modula registry list --network base",
  "  echo-test          0xd619…387B  v1.0  ✓ live",
  "  solidity-audit-v3  0x4a7f…b12c  v3.1  ✓ live",
  "  medical-triage     0x1d90…e847  v2.0  ✓ live",
  "  sentiment-v1       0x8f3c…aa01  v1.0  ✓ live",
];

// How many lines are visible at once in the terminal window
const VISIBLE_LINES = 16;
// Characters per second when typing a new line
const CHARS_PER_SEC = 38;

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

// Scrolling terminal log hook — maintains a growing array of committed
// lines plus the currently-typing partial line. Cycles through LOG_LINES
// indefinitely, one line at a time, scrolling old lines off the top.
function useScrollingLog(startDelay = 0) {
  // Start pre-populated so the terminal never looks empty
  const preload = LOG_LINES.slice(0, VISIBLE_LINES);
  const [committed, setCommitted] = useState<string[]>(preload);
  const [typingLine, setTypingLine] = useState("");
  const [typing, setTyping] = useState(false);
  const lineIdx = useRef(VISIBLE_LINES); // next line to type
  const started = useRef(false);

  useEffect(() => {
    const boot = setTimeout(() => {
      started.current = true;
      scheduleNextLine();
    }, startDelay);
    return () => clearTimeout(boot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scheduleNextLine() {
    const idx = lineIdx.current % LOG_LINES.length;
    const line = LOG_LINES[idx];
    lineIdx.current += 1;

    // Pause after blank lines to give breathing room
    const pauseMs = line === "" ? 600 : 120;

    setTimeout(() => {
      if (line === "") {
        // Blank lines commit instantly — no typing animation
        setCommitted((prev) => {
          const next = [...prev, ""];
          return next.length > VISIBLE_LINES ? next.slice(next.length - VISIBLE_LINES) : next;
        });
        scheduleNextLine();
        return;
      }

      // Type the line char by char
      const durationMs = Math.max(300, (line.length / CHARS_PER_SEC) * 1000);
      setTyping(true);
      setTypingLine("");

      let i = 0;
      const tick = durationMs / line.length;
      const id = setInterval(() => {
        i += 1;
        setTypingLine(line.slice(0, i));
        if (i >= line.length) {
          clearInterval(id);
          // Commit and clear the typing line
          setCommitted((prev) => {
            const next = [...prev, line];
            return next.length > VISIBLE_LINES ? next.slice(next.length - VISIBLE_LINES) : next;
          });
          setTypingLine("");
          setTyping(false);
          scheduleNextLine();
        }
      }, tick);
    }, pauseMs);
  }

  return { committed, typingLine, typing };
}

export function Hero() {
  const { committed, typingLine, typing } = useScrollingLog(800);

  const headline = useTypewriter(HEADLINE, 1100, 200);
  const headlineDone = headline.length === HEADLINE.length;

  const terminalLines = typingLine !== ""
    ? [...committed, typingLine]
    : committed;

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
            {!headlineDone && (
              <span className="hero-caret" aria-hidden="true" />
            )}
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
            <a href="#protocol" className="hero-btn hero-btn-ghost">
              <Play size={13} fill="currentColor" />
              See how it works
            </a>
          </motion.div>

          <motion.p
            className="hero-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: headlineDone ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
          >
            v1.0.0 &nbsp;·&nbsp; Live on{" "}
            <a
              href="https://x.com/base"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-meta-base"
            >
              @Base
            </a>
            &nbsp;·&nbsp; Expanding to{" "}
            <a
              href="https://x.com/solana"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-meta-solana"
            >
              @Solana
            </a>
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
            <span className="hero-shot-url">
              modula.sh — bash
            </span>
          </div>
          <pre className="hero-shot-code">
            <code>
              {terminalLines.map((line, i) => {
                const isLast = i === terminalLines.length - 1;
                const isTypingLine = isLast && typingLine !== "";
                return (
                  <span key={i} style={{ display: "block" }}>
                    {line}
                    {isTypingLine && typing && (
                      <span className="hero-shot-caret" />
                    )}
                  </span>
                );
              })}
            </code>
          </pre>
        </div>

        <div className="hero-trust">
          <span className="hero-trust-label">Powered by the open stack</span>
          <span className="hero-trust-mark">ERC&#8209;7527</span>
          <span className="hero-trust-mark">x402</span>
          <span className="hero-trust-mark">MCP&nbsp;2025‑11‑25</span>
          <span className="hero-trust-mark">@Base</span>
          <span className="hero-trust-mark hero-trust-mark-solana">@Solana</span>
        </div>
      </motion.div>

      <style>{`
        .hero {
          position: relative;
          padding-block: clamp(5rem, 11vw, 9rem) 0;
          background: transparent;
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
          animation: hero-caret-blink 0.8s step-end infinite;
        }
        @keyframes hero-caret-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
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
        .hero-meta-base {
          color: var(--base-blue);
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }
        .hero-meta-base:hover { opacity: 0.72; }
        .hero-meta-solana {
          color: var(--solana);
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }
        .hero-meta-solana:hover { opacity: 0.72; }

        .hero-shot-wrap {
          position: relative;
          margin-top: clamp(3.5rem, 7vw, 6rem);
          padding-inline: 16px;
          background: linear-gradient(180deg, transparent 0%, rgba(244,246,251,0.6) 100%);
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
          overflow: hidden;
          /* Fixed height = 16 visible lines × line-height */
          height: 26.4em;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .hero-shot-code > code {
          display: block;
        }
        .hero-shot-caret {
          display: inline-block;
          width: 0.55ch;
          height: 1.1em;
          vertical-align: -0.18em;
          background: rgba(255, 255, 255, 0.7);
          margin-left: 1px;
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
        .hero-trust-mark-solana {
          color: var(--solana);
        }

        @media (max-width: 720px) {
          .hero-cta { flex-direction: column; width: 100%; max-width: 320px; }
          .hero-btn { justify-content: center; width: 100%; }
          .hero-shot-code { font-size: 11px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-caret,
          .hero-shot-caret { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
