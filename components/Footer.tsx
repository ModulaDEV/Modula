import Link from "next/link";
import { Github, Twitter, Book, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/site.config";

const COLS = [
  {
    title: "Protocol",
    links: [
      { href: "#protocol", label: "How it works" },
      { href: "#economics", label: "Token economics" },
      { href: "#agents", label: "MCP interface" },
      { href: siteConfig.whitepaperPath, label: "Whitepaper" },
    ],
  },
  {
    title: "Registry",
    links: [
      { href: siteConfig.registryPath, label: "Browse models" },
      { href: siteConfig.registryPath + "?filter=lora", label: "LoRAs" },
      { href: siteConfig.registryPath + "?filter=adapter", label: "Adapters" },
      { href: "#registry", label: "List your model" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: siteConfig.docsPath, label: "Documentation" },
      { href: siteConfig.docsPath + "/quickstart", label: "Quickstart" },
      { href: siteConfig.docsPath + "/mcp", label: "MCP integration" },
      { href: siteConfig.githubUrl, label: "GitHub", external: true },
    ],
  },
  {
    title: "Network",
    links: [
      { href: siteConfig.twitter, label: "X / Twitter", external: true },
      { href: siteConfig.baseExplorerUrl, label: "Basescan", external: true },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        borderTop: "1px solid var(--border)",
        padding: "4rem 0 2rem",
        background:
          "linear-gradient(180deg, var(--bg-soft) 0%, var(--bg-softer) 100%)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gap: "2.5rem",
            gridTemplateColumns: "1.35fr repeat(4, 1fr)",
          }}
          className="footer-grid"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo size={32} />
              <div style={{ fontWeight: 600, fontSize: 16 }}>Modula</div>
            </div>
            <p
              style={{
                marginTop: "1rem",
                color: "var(--ink-60)",
                fontSize: 13.5,
                maxWidth: 280,
                lineHeight: 1.65,
              }}
            >
              A permissionless, on-chain registry for AI models.
              Pay-per-inference. Agent-native. Built on Base.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: "1.25rem" }}>
              <a
                href={siteConfig.githubUrl}
                className="btn btn-sm btn-ghost"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={16} />
              </a>
              <a
                href={siteConfig.twitter}
                className="btn btn-sm btn-ghost"
                aria-label="X / Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={16} />
              </a>
              <Link
                href={siteConfig.docsPath}
                className="btn btn-sm btn-ghost"
                aria-label="Documentation"
              >
                <Book size={16} />
              </Link>
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-40)",
                  marginBottom: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {col.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.55rem",
                }}
              >
                {col.links.map((l) => {
                  const isExt = "external" in l && l.external;
                  const linkProps = isExt
                    ? {
                        target: "_blank" as const,
                        rel: "noopener noreferrer" as const,
                      }
                    : {};
                  return (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        {...linkProps}
                        style={{
                          fontSize: 13.5,
                          color: "var(--ink-60)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {l.label}
                        {isExt && (
                          <ArrowUpRight size={12} aria-hidden="true" />
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "3rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: 12,
            color: "var(--ink-40)",
          }}
        >
          <div>
            © {siteConfig.launchYear} Modula Protocol. Released under MIT.
          </div>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span className="mono">Chain: {siteConfig.chain}</span>
            <span className="mono">Standard: {siteConfig.standard}</span>
            <span className="mono">Payments: {siteConfig.paymentRail}</span>
            <span className="mono">Agents: {siteConfig.agentInterface}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          footer .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 540px) {
          footer .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
