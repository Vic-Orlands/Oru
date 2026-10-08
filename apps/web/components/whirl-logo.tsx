"use client";

import { OsoLogo } from "./oso-logo";

/** The product mark. The export name stays so existing call sites keep working. */
export function WhirlLogo({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <OsoLogo size={size} className={className} />;
}
