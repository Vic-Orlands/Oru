import { IconRosetteDiscountCheckFilled } from "@tabler/icons-react";

/** The blue checkmark for integrations made by Oso-Ahia (admin-submitted). */
export function VerifiedBadge({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      title="Verified — made by Oso-Ahia"
      className={`inline-flex shrink-0 text-[#0c82f2] ${className}`}
    >
      <IconRosetteDiscountCheckFilled size={size} aria-label="Verified" />
    </span>
  );
}
