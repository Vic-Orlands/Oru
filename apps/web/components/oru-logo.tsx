"use client";

import { OruBrandLogo } from "./oru-brand-logo";

/** The compact product mark used throughout the application shell. */
export function OruLogo({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <OruBrandLogo size={size} className={className} />;
}
