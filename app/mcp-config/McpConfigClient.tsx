"use client";

import { useState } from "react";
import Link from "next/link";

const GATEWAY = "https://mcp.modulabase.org";

type ClientType = "claude" | "cursor" | "vscode";

const CLIENT_LABELS: Record<ClientType, string> = {
  claude:  "Claude Desktop",
  cursor:  "Cursor",
  vscode:  "VS Code (Copilot)",
};

function buildConfig(slug: string, client: ClientType): string {
  const url = `${GATEWAY}/m/<agency-address>/mcp`;
  const comment = `# Replace <agency-address> with the agency address for "${slug}" from the registry.`;

  if (client === "claude") {
    return `${comment}
{
  "mcpServers": {
    "${slug}": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${url}"]
    }
  }
}`;
  }

  if (client === "cursor") {
    return `${comment}
{
  "mcpServers": {
    "${slug}": {
      "url": "${url}"
    }
  }
}`;
  }

  // VS Code
  return `${comment}
{
  "mcp": {
    "servers": {
      "${slug}": {
        "type": "http",
        "url": "${url}"
      }
    }
  }
}`;
}

const INSTALL_PATHS: Record<ClientType, string> = {
  claude: "~/Library/Application Support/Claude/claude_desktop_config.json",
  cursor: "~/.cursor/mcp.json",
  vscode: ".vscode/mcp.json (workspace) or settings.json (global)",
};

export function McpConfigClient() {
  const [slug, setSlug]         = useState("");
  const [client, setClient]     = useState<ClientType>("claude");
  const [copied, setCopied]     = useState(false);

  const trimmed = slug.trim().toLowerCase();
  const config  = trimmed ? buildConfig(trimmed, client) : "";

  async function copy() {
    if (!config) return;
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Slug input */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label style={labelStyle}>Model slug</label>
        <input
          type="text"
          placeholder="e.g. hello-modula"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={inputStyle}
          spellCheck={false}
          autoCapitalize="none"
        />
        <span style={{ fontSize: 12, color: "var(--ink-40)" }}>
          Find slugs in the{" "}
          <Link href="/registry" style={{ color: "var(--brand)" }}>
            registry
          </Link>
          .
        </span>
      </div>

      {/* Client picker */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label style={labelStyle}>MCP client</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(Object.keys(CLIENT_LABELS) as ClientType[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setClient(k)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: client === k ? "#0b1020" : "transparent",
                color:      client === k ? "#fff" : "var(--ink-60)",
                borderColor: client === k ? "#0b1020" : "var(--border-strong)",
              }}
            >
              {CLIENT_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Config output */}
      {config && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={labelStyle}>Config snippet</label>
            <button
              type="button"
              onClick={copy}
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                border: "1px solid var(--border-strong)",
                background: copied ? "var(--brand)" : "transparent",
                color: copied ? "#fff" : "var(--ink-60)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: "1rem 1.25rem",
              borderRadius: 12,
              background: "#0b1020",
              color: "#c9d1d9",
              fontSize: 12.5,
              lineHeight: 1.65,
              overflowX: "auto",
              border: "1px solid rgba(255,255,255,0.06)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            <code>{config}</code>
          </pre>
          <span style={{ fontSize: 12, color: "var(--ink-40)" }}>
            Paste into{" "}
            <code style={{ fontSize: 11, background: "var(--bg-soft)", padding: "1px 5px", borderRadius: 4 }}>
              {INSTALL_PATHS[client]}
            </code>
          </span>
        </div>
      )}

      {/* Reminder banner */}
      <div
        style={{
          padding: "0.85rem 1rem",
          borderRadius: 10,
          background: "rgba(0,82,255,0.06)",
          border: "1px solid rgba(0,82,255,0.12)",
          fontSize: 13,
          color: "var(--ink-60)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--ink)" }}>Before you call:</strong>{" "}
        look up the agency address for your model on the{" "}
        <Link href="/registry" style={{ color: "var(--brand)", fontWeight: 500 }}>
          registry
        </Link>{" "}
        and replace{" "}
        <code style={{ fontSize: 11, background: "rgba(0,82,255,0.08)", padding: "1px 5px", borderRadius: 4 }}>
          &lt;agency-address&gt;
        </code>{" "}
        in the snippet. Your MCP client will handle payment automatically via x402.
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink-60)",
  letterSpacing: "0.01em",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--bg-soft)",
  fontSize: 14,
  color: "var(--ink)",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};
