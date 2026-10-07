"use client";

/**
 * Oso-Ahia mark: a market stall roof over a rising path.
 * Drawn to read at 16px in the rail and at hero size on the marketing site.
 */
export function OsoLogo({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const dim = `${size}px`;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={`inline-block shrink-0 text-foreground ${className}`}
    >
      <path
        d="M5 14.5 16 6l11 8.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M8.5 14.2V24a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-9.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M13 26v-6.2a3 3 0 0 1 6 0V26"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
