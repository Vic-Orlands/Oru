"use client";

import {
  IconAffiliate,
  IconBriefcase,
  IconCheck,
  IconChevronDown,
  IconCoin,
  IconSparkles,
  IconTargetArrow,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

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

const ICONS: Record<LeadAgentId, Icon> = {
  general: IconSparkles,
  sales: IconTargetArrow,
  job_hunt: IconBriefcase,
  recruiting: IconUsers,
  partnerships: IconAffiliate,
  fundraising: IconCoin,
};

export function AgentSwitcher({ compact = false, contextLabel }: { compact?: boolean; contextLabel?: string }) {
  const activeId = useLeadAgent();
  const active = leadAgentById(activeId);
  const ActiveIcon = ICONS[activeId];
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
            className={`flex items-center rounded-lg text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              compact
                ? "h-8 max-w-full gap-1.5 px-2 text-[11.5px]"
                : "h-9 w-full gap-2 px-2.5 text-[12.5px] sidebar-collapsed:w-10 sidebar-collapsed:justify-center sidebar-collapsed:px-0"
            }`}
          />
        }
      >
        <ActiveIcon size={compact ? 14 : 16} className="shrink-0 text-primary" />
        <span className={compact ? "truncate font-medium" : "min-w-0 flex-1 truncate font-medium sidebar-collapsed:hidden"}>
          {contextLabel ? `${contextLabel} · ${active.shortName}` : active.shortName}
        </span>
        <IconChevronDown
          size={13}
          className={compact ? "shrink-0 text-muted-foreground" : "shrink-0 text-muted-foreground sidebar-collapsed:hidden"}
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
            const AgentIcon = ICONS[agent.id];
            const selected = agent.id === activeId;
            return (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => select(agent.id)}
                className="items-start gap-2.5 px-2 py-2"
              >
                <AgentIcon size={17} className="mt-0.5 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{agent.name}</span>
                  <span className="block text-[11.5px]/4 text-muted-foreground">
                    {agent.description}
                  </span>
                </span>
                {selected && <IconCheck size={15} className="mt-0.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
