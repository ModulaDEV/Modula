import { ImageResponse } from "next/og";
import { siteConfig } from "@/site.config";

export const runtime = "edge";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #0047e0 0%, #0052ff 45%, #2f6bff 100%)",
          color: "white",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "white",
            }}
          >
            M
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Modula</div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 10,
              fontSize: 14,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            <span>Base</span>
            <span>·</span>
            <span>ERC-7527</span>
            <span>·</span>
            <span>x402</span>
            <span>·</span>
            <span>MCP</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 960,
            }}
          >
            The tokenized AI model registry.
          </div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.35,
              maxWidth: 880,
              opacity: 0.92,
            }}
          >
            Permissionless. On-chain. Agent-native. Built on @Base.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            opacity: 0.85,
          }}
        >
          <div>modulabase.org</div>
          <div>© {siteConfig.launchYear} Modula Protocol</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
