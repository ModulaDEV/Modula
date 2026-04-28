import Link from "next/link";
import { Book, Terminal, Plug, Coins, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/site.config";

/**
 * Each card resolves to a real, existing destination — either a section
 * anchor on the home page, the whitepaper, or a file in the public OS
 * repo. There are no /docs/<slug> sub-pages yet, so any link that would
 * have pointed at one routes to the canonical artifact for that topic
 * instead of to a 404.
 */
const SECTIONS: Array<{
  Icon: typeof Book;
  title: string;
  body: string;
  href: string;
  external?: boolean;
}> = [
  {
    Icon: Book,
    title: "Protocol overview",
    body: "How Modula turns a fine-tuned model into a priced, callable, on-chain object.",
    href: "/#protocol",
  },
  {
    Icon: Terminal,
    title: "Quickstart",
    body: "Register your first model in under five minutes. From fine-tune to MCP endpoint.",
    href: `${siteConfig.githubUrl}/blob/main/README.md`,
    external: true,
  },
  {
    Icon: Plug,
    title: "MCP integration",
    body: "Expose any Modula model to Claude, Cursor, or a custom agent as a drop-in tool.",
    href: "/#agents",
  },
  {
    Icon: Coins,
    title: "Economics",
    body: "ERC-7527 bonding curves, creator treasuries, and x402 payment settlement.",
    href: "/#economics",
  },
];

export const metadata = {
  title: "Docs",
  description:
    "Modula protocol documentation — overview, quickstart, MCP integration, and economics.",
};

export default function DocsIndex() {
  return (
    <section className="section" style={{ paddingTop: "5rem" }}>
      <div className="container-narrow">
        <span className="kicker">
          <span className="dot" />
          Documentation
        </span>
        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "0.75rem 0 1rem",
            lineHeight: 1.1,
          }}
        >
          Start reading the protocol.
        </h1>
        <p
          style={{
            color: "var(--ink-60)",
            fontSize: 16.5,
            maxWidth: "42rem",
            lineHeight: 1.6,
            marginBottom: "2.5rem",
          }}
        >
          Docs are a work in progress. The core sections below track the four
          concepts you need to understand to register a model, integrate an
          agent, or build on top of the registry.
        </p>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {SECTIONS.map(({ Icon, title, body, href, external }) => {
            const Element = external ? "a" : Link;
            const anchorProps = external
              ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
              : {};
            return (
            <Element
              key={title}
              href={href}
              {...anchorProps}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "1.5rem",
                borderRadius: 16,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--brand-soft)",
                  border: "1px solid var(--brand-border)",
                  color: "var(--brand)",
                }}
              >
                <Icon size={18} strokeWidth={1.6} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  {title}
                </h3>
                <ArrowUpRight
                  size={16}
                  style={{ color: "var(--ink-40)" }}
                />
              </div>
              <p
                style={{
                  margin: 0,
                  color: "var(--ink-60)",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                }}
              >
                {body}
              </p>
            </Element>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "3rem",
            padding: "1.25rem 1.5rem",
            borderRadius: 14,
            border: "1px solid var(--border-strong)",
            background: "var(--bg-soft)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "var(--ink-60)", fontSize: 14 }}>
            Need the protocol whitepaper?
          </div>
          <Link
            href={siteConfig.whitepaperPath}
            className="btn btn-sm btn-primary"
          >
            Read the whitepaper <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
