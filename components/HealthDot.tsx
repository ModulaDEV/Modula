"use client";

/**
 * Green/red dot showing a model's runtime health_status.
 *
 * status "up"   → green dot
 * status "down" → red dot
 * status null   → grey dot (not yet checked)
 */

interface HealthDotProps {
  status: "up" | "down" | null | undefined;
  size?:  number;
}

export function HealthDot({ status, size = 8 }: HealthDotProps) {
  const color =
    status === "up"   ? "var(--green-500, #22c55e)" :
    status === "down" ? "var(--red-500,   #ef4444)" :
                        "var(--ink-20,    #d1d5db)";

  const label =
    status === "up"   ? "Runtime healthy" :
    status === "down" ? "Runtime down" :
                        "Health unknown";

  return (
    <span
      aria-label={label}
      title={label}
      style={{
        display:       "inline-block",
        width:         size,
        height:        size,
        borderRadius:  "50%",
        background:    color,
        flexShrink:    0,
        boxShadow:     status === "up"
          ? `0 0 0 2px color-mix(in srgb, ${color} 30%, transparent)`
          : undefined,
      }}
    />
  );
}
