/**
 * Live protocol counters strip.
 *
 * Reads /v1/stats from the indexer at request time (cached 30s by
 * lib/api.ts). When the indexer is unreachable we render the
 * fallback (— for each metric) instead of throwing — same graceful
 * degradation pattern as the registry section.
 */
import { Reveal } from "@/components/Reveal";
import { formatCount, formatPrice } from "@/lib/format";

interface MetricsProps {
  stats?: {
    total_models:      number;
    total_calls:       number;
    total_usdc_routed: string;
  } | null;
}

export function ProtocolMetrics({ stats }: MetricsProps = {}) {
  const items = [
    {
      k:   stats ? formatCount(stats.total_models) : "—",
      line: "Models registered",
      sub:  "Each one an ERC-7527 token with its own MCP endpoint.",
    },
    {
      k:   stats ? formatCount(stats.total_calls) : "—",
      line: "Tool calls served",
      sub:  "Every successful tools/call settled on Base via x402.",
    },
    {
      k:   stats ? `$${formatPrice(stats.total_usdc_routed)}` : "—",
      line: "USDC routed to creators",
      sub:  "100% of inference revenue — protocol takes nothing.",
    },
  ];

  return (
    <section id="metrics" className="section" style={{ paddingTop: "0.5rem" }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {items.map((m, i) => (
            <Reveal key={m.line} delay={i * 60}>
              <div
                className="card"
                style={{
                  padding: "1.4rem 1.6rem",
                  borderRadius: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  className="gradient-text mono"
                  style={{
                    fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    marginBottom: "0.5rem",
                  }}
                >
                  {m.k}
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: "var(--ink)",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  {m.line}
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--ink-60)",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                  }}
                >
                  {m.sub}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
