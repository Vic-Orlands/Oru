/** The Ọru logomark, inverted for dark mode like the main app. */
export function OruMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const dim = `${size}px`;
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: dim, height: dim }}
    >
      <img
        src="/oru.svg"
        alt=""
        aria-hidden
        style={{ width: dim, height: dim }}
        className="block dark:invert"
      />
    </span>
  );
}
