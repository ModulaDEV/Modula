import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 28, className }: LogoProps) {
  return (
    <Image
      src="/modula-logo.jpg"
      alt="Modula"
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        borderRadius: "22%",
        objectFit: "cover",
      }}
      priority
    />
  );
}
