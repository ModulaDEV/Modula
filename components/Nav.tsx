"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Book,
  Boxes,
  Coins,
  Bot,
  FileText,
  HelpCircle,
  Layers,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/site.config";

const NAV_LINKS = [
  { href: "/#protocol", label: "Protocol", Icon: Layers },
  { href: "/registry", label: "Registry", Icon: Boxes },
  { href: "/#economics", label: "Economics", Icon: Coins },
  { href: "/#agents", label: "For Agents", Icon: Bot },
  { href: "/whitepaper", label: "Whitepaper", Icon: FileText },
  { href: "/#faq", label: "FAQ", Icon: HelpCircle },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      data-scrolled={scrolled ? "true" : "false"}
      data-open={open ? "true" : "false"}
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: "var(--nav-h)",
        zIndex: 50,
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        background:
          scrolled || open
            ? "rgba(250, 251, 255, 0.82)"
            : "rgba(250, 251, 255, 0.55)",
        borderBottom: `1px solid ${
          scrolled || open ? "var(--border-strong)" : "var(--border)"
        }`,
        boxShadow:
          scrolled || open
            ? "0 6px 24px -14px rgba(11, 16, 32, 0.12)"
            : "none",
        transition:
          "background 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          <Logo size={30} />
          <span style={{ fontSize: 16 }}>Modula</span>
          <span
            className="chip"
            style={{ marginLeft: 6 }}
            aria-label="Built on Base"
          >
            BASE
          </span>
        </Link>

        <nav aria-label="Primary" className="nav-desktop-links">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link"
              style={{
                fontSize: 13.5,
                color: "var(--ink-60)",
                fontWeight: 500,
                letterSpacing: "-0.005em",
                position: "relative",
                padding: "0.25rem 0",
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-desktop-ctas">
          <Link href={siteConfig.docsPath} className="btn btn-sm btn-primary">
            Read the docs
            <ArrowUpRight size={14} />
          </Link>
        </div>

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

      {/* Full-screen backdrop (dims page content behind menu) */}
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
              top: "var(--nav-h)",
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(ellipse at top, rgba(11,16,32,0.18), rgba(11,16,32,0.45))",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 1,
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
              top: "var(--nav-h)",
              left: 0,
              right: 0,
              zIndex: 2,
              padding: "0.85rem 16px 1.25rem",
              background: "rgba(250, 251, 255, 0.96)",
              backdropFilter: "blur(18px) saturate(140%)",
              WebkitBackdropFilter: "blur(18px) saturate(140%)",
              borderBottom: "1px solid var(--border-strong)",
              boxShadow: "0 24px 48px -24px rgba(11, 16, 32, 0.25)",
              maxHeight: "calc(100vh - var(--nav-h))",
              overflowY: "auto",
            }}
          >
            {/* Decorative gradient accent */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, var(--brand), transparent)",
                opacity: 0.5,
              }}
            />

            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-40)",
                fontWeight: 600,
                padding: "0.35rem 0.5rem 0.6rem",
              }}
            >
              Navigate
            </div>

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
                className="btn btn-sm btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setOpen(false)}
              >
                <Book size={14} /> Docs
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -2px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--brand), transparent);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.25s ease;
        }
        .nav-link:hover::after {
          transform: scaleX(1);
        }

        /* Desktop/mobile visibility */
        .nav-desktop-links,
        .nav-desktop-ctas {
          display: none;
        }
        @media (min-width: 900px) {
          .nav-desktop-links {
            display: flex;
            align-items: center;
            gap: 1.75rem;
          }
          .nav-desktop-ctas {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .nav-burger {
            display: none !important;
          }
        }

        /* Animated hamburger */
        .nav-burger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          padding: 0;
          border: 1px solid var(--border-strong);
          background: var(--bg-elev);
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease,
            transform 0.15s ease;
        }
        .nav-burger:hover {
          border-color: var(--brand-border-strong);
          background: var(--brand-softer);
        }
        .nav-burger:active {
          transform: scale(0.96);
        }
        .nav-burger-bars {
          position: relative;
          display: inline-block;
          width: 18px;
          height: 14px;
        }
        .nav-burger-bars > span {
          position: absolute;
          left: 0;
          width: 100%;
          height: 1.75px;
          background: var(--ink);
          border-radius: 2px;
          transition: transform 0.28s cubic-bezier(0.65, 0, 0.35, 1),
            opacity 0.18s ease, top 0.28s cubic-bezier(0.65, 0, 0.35, 1);
        }
        .nav-burger-bars > span:nth-child(1) { top: 1px; }
        .nav-burger-bars > span:nth-child(2) { top: 6px; }
        .nav-burger-bars > span:nth-child(3) { top: 11px; }
        .nav-burger-bars[data-open="true"] > span:nth-child(1) {
          top: 6px;
          transform: rotate(45deg);
        }
        .nav-burger-bars[data-open="true"] > span:nth-child(2) {
          opacity: 0;
          transform: scaleX(0.2);
        }
        .nav-burger-bars[data-open="true"] > span:nth-child(3) {
          top: 6px;
          transform: rotate(-45deg);
        }

        /* Mobile nav row */
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
        .mobile-nav-label {
          flex: 1;
        }
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
