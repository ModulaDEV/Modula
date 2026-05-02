import { siteConfig } from "@/site.config";

const PHASES = [
  {
    status: "done" as const,
    label: "Completed",
    title: "Protocol foundation",
    items: [
      "ERC-7527 bonding curve contracts deployed on Base mainnet",
      "On-chain model registry (ModulaRegistry) live",
      "MCP gateway — agents call any registered model via tools/call",
      "x402 pay-per-inference rail — USDC settles on every call",
      "Indexer — real-time call counts, prices, and bonding curve ticks",
      "Protocol website with live registry browser",
    ],
  },
  {
    status: "done" as const,
    label: "Completed",
    title: "$MODULA token launch on @Base",
    items: [
      "Fair launch of $MODULA on Base mainnet",
      "Bonding curve seeded with initial liquidity",
      "Token-gated model tiers — hold $MODULA, pay less per call",
      "Treasury allocation published on-chain",
    ],
  },
  {
    status: "done" as const,
    label: "Completed",
    title: "Mainnet launch",
    items: [
      "All contracts live on Base mainnet",
      "ModulaRegistry and gateway production-live",
      "Explorer links on mainnet BaseScan",
      "$MODULA holder discount active on gateway",
    ],
  },
  {
    status: "done" as const,
    label: "Completed",
    title: "Model discovery",
    items: [
      "Full-text search across registered models (Postgres tsvector + GIN)",
      "Filter by type, base model, price range, and call volume",
      "Sort by trending, newest, and highest-earning",
      "Model tags and categories surfaced on registry page",
    ],
  },
  {
    status: "next" as const,
    label: "Up next",
    title: "Solana expansion",
    items: [
      "x402 settlement on Solana — agents pay inference in USDC over SVM",
      "Solana-native SDK wrapper — modula.call() with a Solana wallet",
      "Cross-chain model discovery — models registered on Base, callable from Solana",
      "Base remains home — core protocol, registry, and $MODULA on Base, unchanged",
    ],
  },
  {
    status: "planned" as const,
    label: "Planned",
    title: "Creator dashboard",
    items: [
      "Real-time earnings and USDC routed per model",
      "Bonding curve analytics — supply, price history, top callers",
      "Call log with agent identity and latency breakdown",
      "One-click model update and metadata editing",
    ],
  },
  {
    status: "planned" as const,
    label: "Planned",
    title: "Agent SDK",
    items: [
      "npm package — modula.call(slug, args) one-liner for any agent",
      "Auto-handles x402 payment negotiation and signing",
      "Claude, Cursor, and LangChain integration guides",
      "TypeScript-native with full DTO types generated from on-chain ABI",
    ],
  },
] as const;

const STATUS_STYLES = {
  done: {
    dot: "#22c55e",
    badge: "rgba(34,197,94,0.12)",
    badgeText: "#16a34a",
    line: "rgba(34,197,94,0.3)",
  },
  next: {
    dot: "var(--base-blue)",
    badge: "rgba(0,82,255,0.10)",
    badgeText: "var(--base-blue)",
    line: "rgba(0,82,255,0.25)",
  },
  planned: {
    dot: "rgba(11,16,32,0.18)",
    badge: "rgba(11,16,32,0.05)",
    badgeText: "rgba(11,16,32,0.45)",
    line: "rgba(11,16,32,0.08)",
  },
};

export function Roadmap() {
  return (
    <section id="roadmap" className="section">
      <div className="container" style={{ maxWidth: 860 }}>
        <span className="kicker">
          <span className="dot" />
          Roadmap
        </span>
        <h2
          style={{
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "0.6rem 0 0.75rem",
            lineHeight: 1.1,
          }}
        >
          What we've built.<br />Where we're going.
        </h2>
        <p
          style={{
            color: "var(--ink-60)",
            fontSize: 16,
            maxWidth: "38rem",
            lineHeight: 1.6,
            margin: "0 0 3.5rem",
          }}
        >
          One week per milestone. Shipping in public on{" "}
          <a
            href={siteConfig.twitter}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--base-blue)", fontWeight: 500, textDecoration: "none" }}
          >
            @modulabase
          </a>
          .
        </p>

        <div style={{ position: "relative" }}>
          {/* Vertical timeline line */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 11,
              top: 8,
              bottom: 8,
              width: 1,
              background:
                "linear-gradient(180deg, #22c55e 0%, #22c55e 18%, rgba(0,82,255,0.4) 28%, rgba(11,16,32,0.08) 42%, rgba(11,16,32,0.08) 100%)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "2.4rem" }}>
            {PHASES.map((phase, i) => {
              const s = STATUS_STYLES[phase.status];
              return (
                <div
                  key={i}
                  style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}
                >
                  {/* Timeline dot */}
                  <div
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: 23,
                      height: 23,
                      borderRadius: "50%",
                      background: phase.status === "done"
                        ? "#22c55e"
                        : phase.status === "next"
                        ? "var(--base-blue)"
                        : "#fff",
                      border: `2px solid ${s.dot}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 1,
                      boxShadow: phase.status === "next"
                        ? "0 0 0 4px rgba(0,82,255,0.12)"
                        : "none",
                    }}
                  >
                    {phase.status === "done" && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {phase.status === "next" && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: s.badge,
                          color: s.badgeText,
                        }}
                      >
                        {phase.label}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "clamp(1rem, 1.6vw, 1.15rem)",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        margin: "0 0 0.65rem",
                        color: phase.status === "planned" ? "var(--ink-60)" : "var(--ink)",
                      }}
                    >
                      {phase.title}
                    </h3>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "1.1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                      }}
                    >
                      {phase.items.map((item, j) => (
                        <li
                          key={j}
                          style={{
                            fontSize: 14,
                            color: phase.status === "planned"
                              ? "var(--ink-40)"
                              : "var(--ink-60)",
                            lineHeight: 1.5,
                          }}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
