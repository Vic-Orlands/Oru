"use client";

/** The Ọru petal mark. A mask lets the shared asset inherit `currentColor`,
 *  so the same component remains crisp on light, dark, and image surfaces. */
export function OruBrandLogo({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const dim = `${size}px`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current text-foreground ${className}`}
      style={{
        width: dim,
        height: dim,
        WebkitMaskImage: "url('/oru.svg')",
        maskImage: "url('/oru.svg')",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
