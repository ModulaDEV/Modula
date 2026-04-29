import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, Copy, CloudOff } from "lucide-react";

import { getModel, getRevenue, type ModelDetailDto, type RevenueDto } from "@/lib/api";
import {
  shortHex,
  formatCount,
  formatPrice,
  trendToNumbers,
  ipfsUrl,
  timeAgo,
} from "@/lib/format";
import { siteConfig } from "@/site.config";
import { RevenueChart } from "@/components/RevenueChart";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 30;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `${slug} · Registry`,
    description: `${slug} on the Modula registry — bonding curve, MCP endpoint, recent calls, and creator treasury.`,
  };
}

export default async function ModelDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let model: ModelDetailDto;
  let revenue: RevenueDto | null = null;
  try {
    // Revenue is non-essential for the page — surface a degraded card if it
    // fails rather than blowing up the whole detail view.
    const [m, r] = await Promise.allSettled([getModel(slug), getRevenue(slug, "7d")]);
    if (m.status === "rejected") throw m.reason;
    model = m.value;
    if (r.status === "fulfilled") revenue = r.value;
    else console.warn("[registry/[slug]] revenue fetch failed", r.reason);
  } catch (err) {
    // 404 from the indexer = the model truly doesn't exist; render Next's
    // notFound. Anything else (network error, 5xx, indexer offline) is a
    // platform issue — show an offline placeholder instead of a 500 so
    // visitors arriving from the registry table don't see a broken page.
    if (err instanceof Error && /\b404\b/.test(err.message)) notFound();
    console.warn("[registry/[slug]] indexer fetch failed, rendering offline state", err);
    return <OfflineState slug={slug} />;
  }

  const mcpUrl = `https://mcp.${siteConfig.url.replace(/^https?:\/\//, "")}/m/${model.agency}/mcp`;
  const trend  = trendToNumbers(model.trend);

  return (
    <section className="section" style={{ paddingTop: "5rem" }}>
      <div className="container" style={{ maxWidth: 920 }}>
        <Link
          href="/registry"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--ink-60)",
            textDecoration: "none",
            marginBottom: "1.25rem",
          }}
        >
          <ArrowLeft size={14} /> All models
        </Link>

        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            {model.slug}
          </h1>
          {model.model_type && <span className="chip">{model.model_type}</span>}
          {model.base_model && (
            <span
              className="mono"
              style={{ fontSize: 13, color: "var(--ink-40)" }}
            >
              {model.base_model}
            </span>
          )}
        </div>

        <div
          className="mono"
          style={{ fontSize: 12, color: "var(--ink-40)", marginTop: 4 }}
        >
          {model.id}
        </div>

        {/* ---------- key/value strip ---------- */}
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            marginTop: "2rem",
          }}
        >
          <Stat label="Calls"          value={formatCount(model.calls)} />
          <Stat label="USDC routed"    value={`$${formatPrice(model.total_paid_usdc)}`} />
          <Stat label="Latest price"   value={`$${formatPrice(model.latest_price_usdc)}`} />
          <Stat label="Curve supply"   value={model.latest_supply?.toLocaleString() ?? "—"} />
        </div>

        {/* ---------- MCP endpoint ---------- */}
        <Card title="MCP endpoint" hint="Any MCP-aware agent (Claude, Cursor, custom) can call this URL.">
          <CodeRow value={mcpUrl} />
        </Card>

        {/* ---------- creator revenue ---------- */}
        <Card
          title="Revenue (last 7 days)"
          hint={revenue
            ? `${formatCount(revenue.total_calls)} calls · $${formatPrice(revenue.total_paid_usdc)} earned · avg ${(revenue.total_calls / Math.max(1, revenue.buckets.length)).toFixed(1)} calls/day`
            : "Daily breakdown of paid inference calls."}
        >
          {revenue
            ? <RevenueChart buckets={revenue.buckets} period={revenue.period} />
            : <Empty msg="Revenue data unavailable." />}
        </Card>

        {/* ---------- bonding curve ---------- */}
        <Card title="Bonding curve" hint="Last 12 wraps / unwraps. Each tick is one mint or burn on the Agency.">
          {trend.length > 0
            ? <Chart points={trend} />
            : <Empty msg="No curve activity yet." />}
        </Card>

        {/* ---------- on-chain ---------- */}
        <Card title="On-chain">
          <KV label="Agency"    value={model.agency} />
          <KV label="App (NFT)" value={model.app} />
          <KV label="Treasury"  value={model.treasury} />
          <KV label="Creator"   value={model.creator} />
          <KV label="Manifest"  value={model.manifest_uri ?? "—"} link={ipfsUrl(model.manifest_uri)} />
          <KV label="Registered" value={`${timeAgo(model.registered_at)} · ${model.registered_at}`} />
        </Card>

        {/* ---------- recent calls ---------- */}
        <Card title="Recent calls" hint={`${model.recent_calls.length} of ${formatCount(model.calls)} total.`}>
          {model.recent_calls.length === 0 ? (
            <Empty msg="No calls yet." />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", color: "var(--ink-40)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Agent</th>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Paid</th>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Latency</th>
                  <th style={{ padding: "0.6rem 0.5rem" }}>When</th>
                  <th style={{ padding: "0.6rem 0.5rem" }}>Tx</th>
                </tr>
              </thead>
              <tbody>
                {model.recent_calls.map((c) => (
                  <tr key={c.tx_hash} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="mono" style={{ padding: "0.6rem 0.5rem", fontSize: 12 }}>
                      {shortHex(c.agent)}
                    </td>
                    <td className="mono" style={{ padding: "0.6rem 0.5rem", fontSize: 12 }}>
                      ${formatPrice(c.paid_usdc)}
                    </td>
                    <td style={{ padding: "0.6rem 0.5rem", color: "var(--ink-60)" }}>
                      {c.latency_ms}ms
                    </td>
                    <td style={{ padding: "0.6rem 0.5rem", color: "var(--ink-60)" }}>
                      {timeAgo(c.ts)}
                    </td>
                    <td style={{ padding: "0.6rem 0.5rem" }}>
                      <a
                        href={`${siteConfig.baseExplorerUrl}/tx/${c.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--base-blue-600)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}
                      >
                        {shortHex(c.tx_hash)} <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div style={{ marginTop: "2rem", fontSize: 13, color: "var(--ink-60)" }}>
          <a
            href={`${siteConfig.githubUrl}/blob/main/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--base-blue-600)", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            Call this model from your agent <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------- presentational helpers ----------

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="card"
      style={{ padding: "1rem 1.1rem", borderRadius: 12 }}
    >
      <div style={{ fontSize: 11, color: "var(--ink-40)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "1.25rem", borderRadius: 14, marginTop: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--ink-40)" }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function KV({ label, value, link }: { label: string; value: string; link?: string | null }) {
  const display = value.length > 20 ? shortHex(value) : value;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderTop: "1px solid var(--border)", fontSize: 13 }}>
      <span style={{ color: "var(--ink-40)" }}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="mono" style={{ color: "var(--base-blue-600)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {display} <ExternalLink size={11} />
        </a>
      ) : (
        <span className="mono" style={{ color: "var(--ink-80)" }}>{display}</span>
      )}
    </div>
  );
}

function CodeRow({ value }: { value: string }) {
  return (
    <div
      className="mono"
      style={{
        padding: "0.7rem 0.9rem",
        background: "var(--bg-soft)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        fontSize: 12.5,
        wordBreak: "break-all",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ flex: 1 }}>{value}</span>
      <Copy size={13} style={{ color: "var(--ink-40)" }} />
    </div>
  );
}

function Chart({ points }: { points: number[] }) {
  const w = 800;
  const h = 160;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1e-9, max - min);
  const step = w / Math.max(1, points.length - 1);
  const d = points
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 160 }} aria-label="bonding curve">
      <path d={d} fill="none" stroke="#0052ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--ink-40)", fontSize: 13 }}>
      {msg}
    </div>
  );
}

function OfflineState({ slug }: { slug: string }) {
  return (
    <section className="section" style={{ paddingTop: "5rem" }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <Link
          href="/registry"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--ink-60)",
            textDecoration: "none",
            marginBottom: "1.5rem",
          }}
        >
          <ArrowLeft size={14} /> All models
        </Link>
        <div
          className="card"
          style={{
            padding: "2.5rem 2rem",
            borderRadius: 16,
            textAlign: "center",
            border: "1px dashed var(--brand-border)",
            background: "var(--brand-softer)",
          }}
        >
          <CloudOff size={32} style={{ color: "var(--ink-40)", marginBottom: "1rem" }} />
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 0.5rem" }}>
            Indexer offline
          </h1>
          <p
            style={{
              color: "var(--ink-60)",
              fontSize: 14,
              lineHeight: 1.6,
              margin: "0 0 1.25rem",
              maxWidth: "32rem",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            We can't reach the read API right now, so we can't show details for{" "}
            <span className="mono" style={{ color: "var(--ink-80)" }}>{slug}</span>.
            The model data lives on chain — try again in a moment, or browse the
            registry preview while we restore service.
          </p>
          <Link href="/registry" className="btn btn-sm">
            Back to registry
          </Link>
        </div>
      </div>
    </section>
  );
}
