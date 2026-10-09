"use client";

import { IconCheck, IconChevronDown } from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LEAD_AGENTS,
  leadAgentById,
  setLeadAgent,
  useLeadAgent,
  type LeadAgentId,
} from "@/lib/lead-agents";
import { useView } from "@/lib/view";
import { AgentAvatar } from "./agent-avatar";

export function AgentSwitcher({
  compact = false,
  contextLabel,
}: {
  compact?: boolean;
  contextLabel?: string;
}) {
  const activeId = useLeadAgent();
  const active = leadAgentById(activeId);
  const { openHome } = useView();

  const select = (id: LeadAgentId) => {
    setLeadAgent(id);
    openHome();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Agent: ${active.shortName}`}
            className={`flex items-center rounded-md text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              compact
                ? "h-8 max-w-full gap-1.5 px-2 text-[12.5px]/4"
                : "h-8 w-full gap-2 px-2.5 text-[13px]/4 sidebar-collapsed:w-10 sidebar-collapsed:justify-center sidebar-collapsed:px-0"
            }`}
          />
        }
      >
        <AgentAvatar agentId={activeId} size={compact ? 18 : 24} />
        <span
          className={
            compact
              ? "truncate font-medium"
              : "min-w-0 flex-1 truncate font-medium sidebar-collapsed:hidden"
          }
        >
          {contextLabel ? `${contextLabel} · ${active.shortName}` : active.shortName}
        </span>
        <IconChevronDown
          size={13}
          className={
            compact
              ? "shrink-0 text-muted-foreground"
              : "shrink-0 text-muted-foreground sidebar-collapsed:hidden"
          }
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-[min(21rem,calc(100vw-2rem))] p-1.5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">Agents</DropdownMenuLabel>
          {LEAD_AGENTS.map((agent) => {
            const selected = agent.id === activeId;
            return (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => select(agent.id)}
                className="items-start gap-2.5 px-2 py-2"
              >
                <AgentAvatar agentId={agent.id} size={30} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">
                    {agent.name}
                  </span>
                  <span className="block text-[11.5px]/4 text-muted-foreground">
                    {agent.description}
                  </span>
                </span>
                {selected && (
                  <IconCheck size={15} className="mt-0.5 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
