type LogoProps = {
  size?: number;
  mono?: boolean;
  className?: string;
};

export function Logo({ size = 28, mono = false, className }: LogoProps) {
  const fill = mono ? "currentColor" : "#0052ff";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-label="Modula"
      role="img"
    >
      <defs>
        <linearGradient id="modula-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={mono ? "currentColor" : "#2f6bff"} />
          <stop offset="100%" stopColor={mono ? "currentColor" : "#0047e0"} />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill={mono ? "transparent" : "url(#modula-grad)"}
        stroke={mono ? fill : "none"}
        strokeWidth={mono ? 2 : 0}
      />
      <path
        d="M16 46 V22 L26 36 L32 28 L38 36 L48 22 V46"
        fill="none"
        stroke={mono ? fill : "#ffffff"}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="50" r="2" fill={mono ? fill : "#ffffff"} />
    </svg>
  );
}
