import type { RevenueBucketDto, RevenuePeriod } from "@/lib/api";

interface Props {
  buckets: RevenueBucketDto[];
  period:  RevenuePeriod;
}

const W = 800;
const H = 160;
const PAD_X = 8;
const PAD_Y = 12;

export function RevenueChart({ buckets, period }: Props) {
  if (buckets.length === 0) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--ink-40)", fontSize: 13 }}>
        No revenue data in the last {period}.
      </div>
    );
  }

  const usdc = buckets.map((b) => Number(b.paid_usdc));
  const max  = Math.max(...usdc, 0);
  const span = Math.max(max, 1e-9);
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const step = innerW / Math.max(1, buckets.length - 1);

  const pts = usdc.map((v, i) => {
    const x = PAD_X + i * step;
    const y = PAD_Y + innerH - (v / span) * innerH;
    return { x, y };
  });

  const polyline = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const baseline = PAD_Y + innerH;
  const fillPath =
    `M ${pts[0]!.x.toFixed(2)} ${baseline} ` +
    pts.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") +
    ` L ${pts[pts.length - 1]!.x.toFixed(2)} ${baseline} Z`;

  const firstLabel = buckets[0]!.day.slice(5);
  const lastLabel  = buckets[buckets.length - 1]!.day.slice(5);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: H, display: "block" }}
        aria-label={`Revenue over the last ${period}`}
      >
        <line
          x1={PAD_X} x2={W - PAD_X} y1={baseline} y2={baseline}
          stroke="var(--border)" strokeWidth="1"
        />
        <path d={fillPath} fill="rgba(0, 82, 255, 0.08)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="#0052ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={usdc[i]! > 0 ? 2.5 : 0}
            fill="#0052ff"
          />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--ink-40)",
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>{firstLabel}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
}
