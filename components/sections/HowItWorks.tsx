"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, UploadCloud, Boxes, Bot } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    Icon: BrainCircuit,
    title: "Fine-tune",
    body: "A creator trains a LoRA, adapter, or small specialized model on a domain they know better than anyone else.",
  },
  {
    n: "02",
    Icon: UploadCloud,
    title: "Register on-chain",
    body: "The creator registers the model via ERC-7527. A bonding-curve token is minted and an MCP endpoint is generated.",
  },
  {
    n: "03",
    Icon: Boxes,
    title: "Indexed in the registry",
    body: "The model becomes discoverable on-chain. Any indexer, app, or agent can read it — no platform account required.",
  },
  {
    n: "04",
    Icon: Bot,
    title: "Called by agents",
    body: "Agents discover the MCP endpoint, sign an x402 payment, and call the model as a tool. Demand pushes the curve — price is quality.",
  },
] as const;

const CYCLE_MS = 3200;

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  // Pause when the section isn't visible (no cost when off-screen).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance.
  useEffect(() => {
    if (paused || !inView) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % STEPS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, inView]);

  const progressPct =
    STEPS.length > 1 ? (active / (STEPS.length - 1)) * 100 : 0;

  return (
    <section id="protocol" className="section" ref={sectionRef}>
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">
              <span className="dot" />
              How it works
            </span>
            <h2 className="section-title">
              Four primitives. One on-chain loop.
            </h2>
            <p className="section-sub">
              Modula turns a fine-tuned model into a priced, callable, on-chain
              object. The entire lifecycle — from registration to agent call to
              price discovery — happens natively on Base.
            </p>
          </div>
        </Reveal>

        <div
          className="hiw-timeline"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {/* Horizontal connection rail (desktop) */}
          <div className="hiw-rail" aria-hidden="true">
            <div className="hiw-rail-track" />
            <motion.div
              className="hiw-rail-fill"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
            />
            <motion.div
              className="hiw-rail-packet"
              animate={{ left: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
            />
          </div>

          <ol className="hiw-steps">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              const isPast = i < active;
              return (
                <li
                  key={s.n}
                  className={`hiw-step ${isActive ? "is-active" : ""} ${
                    isPast ? "is-past" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="hiw-step-inner card"
                    onClick={() => setActive(i)}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Step ${s.n}: ${s.title}`}
                  >
                    <span
                      className="hiw-step-n"
                      aria-hidden="true"
                    >
                      {s.n}
                    </span>

                    <span className="hiw-icon-wrap">
                      {isActive && (
                        <motion.span
                          layoutId="hiw-halo"
                          className="hiw-icon-halo"
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 26,
                          }}
                        />
                      )}
                      <span className="hiw-icon">
                        <s.Icon size={20} strokeWidth={1.7} />
                      </span>
                    </span>

                    <span className="hiw-step-meta">
                      <span className="hiw-step-label">Step {s.n}</span>
                      <span className="hiw-step-title">{s.title}</span>
                    </span>

                    <AnimatePresence mode="wait">
                      <motion.p
                        key={isActive ? "a" : "d"}
                        className="hiw-step-body"
                        initial={{ opacity: 0.55 }}
                        animate={{ opacity: isActive ? 1 : 0.55 }}
                        transition={{ duration: 0.35 }}
                      >
                        {s.body}
                      </motion.p>
                    </AnimatePresence>

                    {isActive && (
                      <motion.span
                        layoutId="hiw-underline"
                        className="hiw-step-underline"
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <style>{`
        .hiw-timeline {
          position: relative;
        }

        .hiw-rail {
          position: relative;
          height: 2px;
          margin: 0 8% 2.25rem;
        }
        .hiw-rail-track {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(11, 16, 32, 0.1) 10%,
            rgba(11, 16, 32, 0.1) 90%,
            transparent 100%
          );
          border-radius: 999px;
        }
        .hiw-rail-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 0;
          background: linear-gradient(
            90deg,
            rgba(0, 82, 255, 0) 0%,
            rgba(0, 82, 255, 0.6) 15%,
            rgba(47, 107, 255, 0.9) 50%,
            rgba(94, 139, 255, 0.9) 100%
          );
          border-radius: 999px;
          box-shadow: 0 0 12px rgba(0, 82, 255, 0.45);
          will-change: width;
        }
        .hiw-rail-packet {
          position: absolute;
          top: 50%;
          left: 0;
          width: 14px;
          height: 14px;
          margin: -7px 0 0 -7px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 50% 50%,
            #fff 0%,
            #2f6bff 45%,
            rgba(0, 82, 255, 0) 75%
          );
          box-shadow: 0 0 14px rgba(0, 82, 255, 0.85),
            0 0 28px rgba(0, 82, 255, 0.45);
          will-change: left, transform;
          animation: hiw-packet-pulse 1.6s ease-in-out infinite;
        }

        @keyframes hiw-packet-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.25); }
        }

        .hiw-steps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.1rem;
        }

        .hiw-step {
          position: relative;
          display: flex;
          min-width: 0;
        }

        .hiw-step-inner {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          width: 100%;
          padding: 1.4rem 1.35rem 1.5rem !important;
          text-align: left;
          border: none;
          cursor: pointer;
          color: inherit;
          font: inherit;
          transition:
            transform 0.35s var(--ease-out),
            box-shadow 0.35s var(--ease-out),
            opacity 0.35s var(--ease-out);
        }

        .hiw-step:not(.is-active) .hiw-step-inner {
          opacity: 0.78;
        }

        .hiw-step.is-active .hiw-step-inner {
          transform: translate3d(0, -4px, 0);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 0 0 4px var(--brand-softer),
            0 20px 40px -22px rgba(0, 82, 255, 0.55);
        }

        .hiw-step-n {
          position: absolute;
          top: 2px;
          right: 8px;
          font-family: var(--font-mono);
          font-size: 3.2rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1;
          color: rgba(0, 82, 255, 0.07);
          pointer-events: none;
          transition: color 0.4s var(--ease-out),
            transform 0.4s var(--ease-out);
          will-change: color;
        }
        .hiw-step.is-active .hiw-step-n {
          color: rgba(0, 82, 255, 0.16);
          transform: translate3d(-2px, 0, 0);
        }
        .hiw-step.is-past .hiw-step-n {
          color: rgba(0, 82, 255, 0.11);
        }

        .hiw-icon-wrap {
          position: relative;
          width: 46px;
          height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .hiw-icon {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.85),
            rgba(0, 82, 255, 0.1)
          );
          border: 1px solid var(--brand-border);
          color: var(--brand);
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset,
            0 6px 16px -10px rgba(0, 82, 255, 0.4);
          transition:
            transform 0.4s var(--ease-out),
            border-color 0.4s var(--ease-out),
            background 0.4s var(--ease-out),
            color 0.4s var(--ease-out);
          will-change: transform;
        }

        .hiw-step.is-active .hiw-icon {
          transform: scale(1.08) rotate(-3deg);
          background: linear-gradient(
            180deg,
            #ffffff 0%,
            #d6e2ff 100%
          );
          border-color: var(--brand);
          color: var(--base-blue-600);
        }

        .hiw-icon-halo {
          position: absolute;
          inset: -10px;
          border-radius: 16px;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(0, 82, 255, 0.22),
            rgba(0, 82, 255, 0) 70%
          );
          border: 1px solid rgba(0, 82, 255, 0.25);
          box-shadow: 0 0 32px rgba(0, 82, 255, 0.35);
          z-index: 1;
          pointer-events: none;
          animation: hiw-halo-breathe 2.4s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes hiw-halo-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.1); opacity: 0.7; }
        }

        .hiw-step-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .hiw-step-label {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-40);
          font-weight: 600;
        }
        .hiw-step-title {
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--ink);
        }

        .hiw-step-body {
          margin: 0;
          color: var(--ink-60);
          font-size: 13.5px;
          line-height: 1.6;
          flex: 1;
        }

        .hiw-step-underline {
          position: absolute;
          left: 1.35rem;
          right: 1.35rem;
          bottom: 0.9rem;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--brand) 50%,
            transparent 100%
          );
          border-radius: 2px;
        }

        /* Mobile: vertical timeline with a rail on the left */
        @media (max-width: 860px) {
          .hiw-rail {
            display: none;
          }
          .hiw-steps {
            grid-template-columns: 1fr;
            position: relative;
          }
          .hiw-steps::before {
            content: "";
            position: absolute;
            left: 22px;
            top: 12px;
            bottom: 12px;
            width: 2px;
            background: linear-gradient(
              180deg,
              rgba(11, 16, 32, 0.08) 0%,
              rgba(0, 82, 255, 0.3) 50%,
              rgba(11, 16, 32, 0.08) 100%
            );
            border-radius: 2px;
          }
          .hiw-step-inner {
            padding-left: 3.25rem !important;
          }
          .hiw-icon-wrap {
            position: absolute;
            top: 1.4rem;
            left: -1.1rem;
          }
        }
      `}</style>
    </section>
  );
}
