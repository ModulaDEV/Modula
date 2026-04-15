"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/site.config";

const NAV_LINKS = [
  { href: "/#protocol", label: "Protocol" },
  { href: "/registry", label: "Registry" },
  { href: "/#economics", label: "Economics" },
  { href: "/#agents", label: "For Agents" },
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/#faq", label: "FAQ" },
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

  return (
    <header
      className="nav-outer"
      data-scrolled={scrolled ? "true" : "false"}
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: "var(--nav-h)",
        zIndex: 50,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        background: scrolled
          ? "rgba(255, 255, 255, 0.82)"
          : "rgba(255, 255, 255, 0.6)",
        borderBottom: `1px solid ${
          scrolled ? "var(--border-strong)" : "var(--border)"
        }`,
        transition: "background 0.2s ease, border-color 0.2s ease",
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

        <nav
          aria-label="Primary"
          style={{ display: "none", alignItems: "center", gap: "1.75rem" }}
          className="hide-on-mobile"
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: 13.5,
                color: "var(--ink-60)",
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div
          style={{ display: "none", alignItems: "center", gap: 10 }}
          className="hide-on-mobile"
        >
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-ghost"
          >
            GitHub
          </a>
          <Link href={siteConfig.docsPath} className="btn btn-sm btn-primary">
            Read the docs
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="btn btn-sm"
          style={{
            display: "inline-flex",
            padding: "0.5rem",
            borderRadius: 8,
          }}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
          <span className="hide-on-mobile" style={{ display: "none" }} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Mobile navigation"
          style={{
            position: "absolute",
            top: "var(--nav-h)",
            left: 0,
            right: 0,
            padding: "1rem 1rem 1.25rem",
            background: "rgba(255, 255, 255, 0.98)",
            borderBottom: "1px solid var(--border-strong)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                padding: "0.6rem 0.2rem",
                color: "var(--ink-80)",
                fontSize: 14,
                fontWeight: 500,
                borderBottom: "1px solid var(--border)",
              }}
            >
              {l.label}
            </a>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{ flex: 1 }}
            >
              GitHub
            </a>
            <Link
              href={siteConfig.docsPath}
              className="btn btn-sm btn-primary"
              style={{ flex: 1 }}
              onClick={() => setOpen(false)}
            >
              Docs
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
