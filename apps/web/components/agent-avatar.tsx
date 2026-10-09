import Image from "next/image";

import type { LeadAgentId } from "@/lib/lead-agents";
import { cn } from "@/lib/utils";

const BACKGROUNDS: Record<LeadAgentId, string> = {
  general: "d1d4f9",
  sales: "b6e3f4",
  job_hunt: "ffd5dc",
  recruiting: "c0ebd7",
  partnerships: "ffdfbf",
  fundraising: "c0aede",
};

function avatarUrl(agentId: LeadAgentId) {
  const params = new URLSearchParams({
    seed: `oru-${agentId}`,
    backgroundColor: BACKGROUNDS[agentId],
    backgroundType: "gradientLinear",
    radius: "24",
  });
  return `https://api.dicebear.com/10.x/bottts-neutral/svg?${params.toString()}`;
}

/** Stable, abstract DiceBear identity for an agent. The adjacent agent name
 *  carries the accessible label, so the artwork stays decorative. */
export function AgentAvatar({
  agentId,
  size = 24,
  className,
}: {
  agentId: LeadAgentId;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md bg-muted shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={avatarUrl(agentId)}
        alt=""
        fill
        unoptimized
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}
