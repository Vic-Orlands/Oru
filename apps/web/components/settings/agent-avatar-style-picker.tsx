"use client";

import { IconCheck } from "@tabler/icons-react";

import { AgentAvatar } from "@/components/agent-avatar";
import {
  AGENT_AVATAR_STYLES,
  type AgentAvatarStyle,
} from "@/lib/agent-avatar-style";
import { cn } from "@/lib/utils";

export function AgentAvatarStylePicker({
  value,
  onChange,
}: {
  value: AgentAvatarStyle;
  onChange: (value: AgentAvatarStyle) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Agent avatar style"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {AGENT_AVATAR_STYLES.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "group flex min-w-0 items-center gap-2.5 rounded-md bg-well px-2.5 py-2 text-left shadow-[inset_0_0_0_1px_var(--well-outline)] transition-[background-color,box-shadow] duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "shadow-[inset_0_0_0_1px_var(--primary)]",
            )}
          >
            <AgentAvatar
              agentId="general"
              avatarStyle={option.value}
              size={30}
            />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
              {option.label}
            </span>
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity",
                selected ? "opacity-100" : "opacity-0",
              )}
            >
              <IconCheck size={11} stroke={3} aria-hidden="true" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
