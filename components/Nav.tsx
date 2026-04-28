"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  Coins,
  Bot,
  FileText,
  HelpCircle,
  Layers,
  Book,
  ArrowUpRight,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/site.config";

const NAV_LINKS = [
  { href: "/#protocol", label: "Protocol", Icon: Layers },
  { href: "/registry", label: "Registry", Icon: Boxes },
  { href: "/#economics", label: "Economics", Icon: Coins },
  { href: "/#agents", label: "Agents", Icon: Bot },
  { href: "/whitepaper", label: "Whitepaper", Icon: FileText },
  { href: "/#faq", label: "FAQ", Icon: HelpCircle },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (open) {
      const prev = body.style.overflow;
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <header
      className="nav-outer"
      data-open={open ? "true" : "false"}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "var(--nav-h)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* Centered floating pill */}
      <div className="nav-pill" style={{ pointerEvents: "auto" }}>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="nav-brand"
          aria-label="Modula home"
        >
          <Logo size={22} />
          <span className="nav-brand-name">Modula</span>
        </Link>

        <span className="nav-sep" aria-hidden="true" />

        <nav aria-label="Primary" className="nav-pill-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-pill-link">
              {l.label}
            </a>
          ))}
        </nav>

        <Link
          href={siteConfig.registryPath}
          className="nav-pill-cta"
          onClick={() => setOpen(false)}
        >
          Launch app
        </Link>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="nav-burger"
        >
          <span className="nav-burger-bars" data-open={open ? "true" : "false"}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              background:
                "radial-gradient(ellipse at top, rgba(11,16,32,0.10), rgba(11,16,32,0.32))",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: -1,
              pointerEvents: "auto",
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              position: "absolute",
              top: "calc(var(--nav-h) - 4px)",
              left: 12,
              right: 12,
              maxWidth: 480,
              marginInline: "auto",
              padding: "0.85rem 1rem 1rem",
              background: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(18px) saturate(140%)",
              WebkitBackdropFilter: "blur(18px) saturate(140%)",
              border: "1px solid rgba(11, 16, 32, 0.08)",
              borderRadius: 18,
              boxShadow: "0 24px 48px -24px rgba(11, 16, 32, 0.25)",
              maxHeight: "calc(100vh - var(--nav-h) - 24px)",
              overflowY: "auto",
              pointerEvents: "auto",
            }}
          >
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {NAV_LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.05 + i * 0.035,
                    duration: 0.22,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="mobile-nav-link"
                  >
                    <span className="mobile-nav-ico">
                      <l.Icon size={16} strokeWidth={1.7} />
                    </span>
                    <span className="mobile-nav-label">{l.label}</span>
                    <ArrowUpRight
                      size={15}
                      className="mobile-nav-arrow"
                      strokeWidth={1.7}
                    />
                  </a>
                </motion.li>
              ))}
            </ul>

            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, var(--border-strong), transparent)",
                margin: "0.9rem 0.5rem",
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.22 }}
              style={{ display: "flex", gap: 10, padding: "0 0.5rem" }}
            >
              <Link
                href={siteConfig.docsPath}
                className="btn btn-sm"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setOpen(false)}
              >
                <Book size={14} /> Docs
              </Link>
              <Link
                href={siteConfig.registryPath}
                className="btn btn-sm btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setOpen(false)}
              >
                Launch app
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nav-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 6px 6px 6px 14px;
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid rgba(11, 16, 32, 0.08);
          border-radius: 999px;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.8) inset,
            0 6px 24px -14px rgba(11, 16, 32, 0.18);
          transition: box-shadow 0.2s ease, background 0.2s ease;
        }
        .nav-pill:hover {
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.8) inset,
            0 8px 28px -14px rgba(11, 16, 32, 0.24);
        }
        .nav-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--ink);
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .nav-brand:hover { color: var(--ink); }
        .nav-brand-name { font-size: 14.5px; }

        .nav-sep {
          width: 1px;
          height: 18px;
          background: rgba(11, 16, 32, 0.1);
          margin-inline: 4px;
        }

        .nav-pill-links { display: none; align-items: center; gap: 0.35rem; }
        .nav-pill-link {
          padding: 6px 12px;
          border-radius: 999px;
          color: rgba(11, 16, 32, 0.62);
          font-size: 13.5px;
          font-weight: 500;
          letter-spacing: -0.005em;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .nav-pill-link:hover {
          background: rgba(11, 16, 32, 0.05);
          color: var(--ink);
        }

        .nav-pill-cta {
          display: none;
          align-items: center;
          padding: 8px 16px;
          border-radius: 999px;
          background: #0b1020;
          color: #fff;
          font-size: 13.5px;
          font-weight: 500;
          letter-spacing: -0.005em;
          margin-left: 6px;
          transition: background 0.18s ease, transform 0.15s ease;
        }
        .nav-pill-cta:hover {
          background: #000;
          color: #fff;
          transform: translateY(-1px);
        }

        @media (min-width: 900px) {
          .nav-pill-links { display: inline-flex; }
          .nav-pill-cta { display: inline-flex; }
          .nav-burger { display: none !important; }
        }

        /* Hamburger */
        .nav-burger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          border: none;
          background: rgba(11, 16, 32, 0.05);
          border-radius: 999px;
          cursor: pointer;
          margin-left: 4px;
          transition: background 0.18s ease, transform 0.15s ease;
        }
        .nav-burger:hover { background: rgba(11, 16, 32, 0.08); }
        .nav-burger:active { transform: scale(0.96); }
        .nav-burger-bars {
          position: relative;
          display: inline-block;
          width: 16px;
          height: 12px;
        }
        .nav-burger-bars > span {
          position: absolute;
          left: 0;
          width: 100%;
          height: 1.75px;
          background: var(--ink);
          border-radius: 2px;
          transition:
            transform 0.28s cubic-bezier(0.65, 0, 0.35, 1),
            opacity 0.18s ease,
            top 0.28s cubic-bezier(0.65, 0, 0.35, 1);
        }
        .nav-burger-bars > span:nth-child(1) { top: 1px; }
        .nav-burger-bars > span:nth-child(2) { top: 5px; }
        .nav-burger-bars > span:nth-child(3) { top: 9px; }
        .nav-burger-bars[data-open="true"] > span:nth-child(1) {
          top: 5px; transform: rotate(45deg);
        }
        .nav-burger-bars[data-open="true"] > span:nth-child(2) {
          opacity: 0; transform: scaleX(0.2);
        }
        .nav-burger-bars[data-open="true"] > span:nth-child(3) {
          top: 5px; transform: rotate(-45deg);
        }

        /* Mobile drawer rows */
        .mobile-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          color: var(--ink-80);
          font-size: 15px;
          font-weight: 500;
          letter-spacing: -0.005em;
          min-height: 48px;
          border: 1px solid transparent;
          background: transparent;
          transition: background 0.18s ease, border-color 0.18s ease,
            color 0.18s ease, transform 0.12s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .mobile-nav-link:hover,
        .mobile-nav-link:focus-visible {
          background: var(--brand-softer);
          border-color: var(--brand-border);
          color: var(--ink);
        }
        .mobile-nav-link:active {
          transform: scale(0.99);
          background: var(--brand-soft);
        }
        .mobile-nav-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.8),
            rgba(0, 82, 255, 0.08)
          );
          border: 1px solid var(--brand-border);
          color: var(--brand);
          flex-shrink: 0;
        }
        .mobile-nav-label { flex: 1; }
        .mobile-nav-arrow {
          color: var(--ink-40);
          transition: color 0.18s ease, transform 0.18s ease;
        }
        .mobile-nav-link:hover .mobile-nav-arrow {
          color: var(--brand);
          transform: translate(2px, -2px);
        }
      `}</style>
    </header>
  );
}
