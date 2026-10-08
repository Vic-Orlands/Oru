"use client";

import { useDeskData } from "@/lib/desk-data";
import type { DeskPage } from "@/lib/view";
import { IconExternalLink } from "@tabler/icons-react";
import { ApprovalActions } from "./approval-actions";
import { DeskEmptyState } from "./desk-empty-state";
import { AgentSwitcher } from "@/components/agent-switcher";
import { ProspectEvidence } from "./prospect-evidence";
import { OpportunityTable } from "./opportunity-table";
import { TaskActions } from "./task-actions";
import { ActionApprovalList } from "./action-approval-list";
import { leadAgentById, useLeadAgent } from "@/lib/lead-agents";

const COPY: Record<DeskPage, { title: string; lede: string }> = {
  prospects: {
    title: "Prospects",
    lede: "People the desk has found, scored, and filed into lists.",
  },
  approvals: {
    title: "Approvals",
    lede: "Nothing sends until you say so. Hold is a complete answer.",
  },
  campaigns: {
    title: "Campaigns",
    lede: "Sequences in motion. Steps, sends, and the replies they earned.",
  },
  pipeline: {
    title: "Pipeline",
    lede: "How a name becomes a meeting. Rates are from the step above.",
  },
  tasks: {
    title: "Tasks",
    lede: "What the desk is doing, and what is waiting on you.",
  },
  performance: {
    title: "Performance",
    lede: "The week, without a dashboard nobody opens.",
  },
};

export function DeskPages({ page }: { page: DeskPage }) {
  const copy = COPY[page];
  return (
    <div className="h-full min-h-0 overflow-y-auto px-5 py-6 md:px-8">
      <header className="mb-5 flex w-full items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-[13px]/5 text-muted-foreground">{copy.lede}</p>
        </div>
        <div className="shrink-0 rounded-lg bg-card ring-1 ring-border md:hidden">
          <AgentSwitcher compact />
        </div>
      </header>
      {page === "prospects" && <Prospects />}
      {page === "approvals" && <Approvals />}
      {page === "campaigns" && <Campaigns />}
      {page === "pipeline" && <Pipeline />}
      {page === "tasks" && <Tasks />}
      {page === "performance" && <Performance />}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">{children}</div>;
}

function Prospects() {
  const { lists, prospects, opportunities } = useDeskData();
  const agent = leadAgentById(useLeadAgent());
  if (prospects.length === 0 && opportunities.length === 0) {
    return (
      <DeskEmptyState
        title={`No ${agent.noun} yet`}
        description={`Ask the chat to research and file source-backed ${agent.noun}. Live Exa or Parallel results will appear here.`}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <OpportunityTable />
      {prospects.length > 0 && <>
      <div className="flex flex-wrap gap-2">
        {lists.map((list) => (
          <span key={list.id} className="rounded-full bg-accent px-2.5 py-1 text-[12px]">
            {list.name}
            <span className="ml-1 tabular-nums text-muted-foreground">{list.count}</span>
          </span>
        ))}
      </div>
      <Panel>
        <table className="w-full text-left text-[12.5px]">
          <thead className="text-[11px] tracking-wide text-muted-foreground uppercase">
            <tr className="border-b border-border">
              {["Name", "Company", "List", "Score", "Fit", "Status"].map((head) => (
                <th key={head} className="px-3 py-2 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prospects.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>{row.name}</span>
                    {(row.profileUrl ?? row.sourceUrl) && (
                      <a
                        href={row.profileUrl ?? row.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open source for ${row.name}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <IconExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">{row.title}</div>
                  <ProspectEvidence
                    provider={row.sourceProvider}
                    tool={row.sourceTool}
                    receiptHash={row.sourceReceiptHash}
                    capturedAt={row.sourceCapturedAt}
                    reason={row.scoreReason}
                    evidence={row.evidence}
                    breakdown={row.scoreBreakdown}
                  />
                </td>
                <td className="px-3 py-2">{row.company}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.list}</td>
                <td className="px-3 py-2 tabular-nums">{row.score}</td>
                <td className="px-3 py-2">{row.fit}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      </>}
    </div>
  );
}

function Approvals() {
  const { approvals, actionApprovals } = useDeskData();
  if (approvals.length === 0 && actionApprovals.length === 0) {
    return (
      <DeskEmptyState
        title="Nothing is waiting"
        description="Drafts created from real prospect work will wait here until you approve or hold them."
      />
    );
  }
  return (
    <div className="flex w-full flex-col gap-3">
      <ActionApprovalList />
      <div className="grid w-full gap-3 xl:grid-cols-2">
      {approvals.map((draft) => (
        <Panel key={draft.id}>
          <div className="px-4 py-3">
            <div className="text-[11.5px] text-muted-foreground">
              {draft.sequence} · {draft.step} · {draft.to}, {draft.company}
            </div>
            <h2 className="mt-1 text-[14px] font-medium">{draft.subject}</h2>
            <p className="mt-2 text-[13px]/5 text-foreground/90">{draft.preview}</p>
            <div className="mt-3">
              <ApprovalActions
                approvalId={draft.id}
                recipient={draft.to}
              />
            </div>
          </div>
        </Panel>
      ))}
      </div>
    </div>
  );
}

function Campaigns() {
  const { campaigns } = useDeskData();
  if (campaigns.length === 0) {
    return (
      <DeskEmptyState
        title="No campaigns yet"
        description="Campaigns will appear after a connected sending platform returns real activity."
      />
    );
  }
  return (
    <div className="w-full overflow-x-auto">
      <Panel>
      <table className="w-full text-left text-[12.5px]">
        <thead className="text-[11px] tracking-wide text-muted-foreground uppercase">
          <tr className="border-b border-border">
            {["Sequence", "Sent", "Replies", "Meetings", "Status"].map((head) => (
              <th key={head} className="px-3 py-2 font-medium">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((row) => (
            <tr key={row.name} className="border-b border-border last:border-0">
              <td className="px-3 py-2.5 font-medium">{row.name}</td>
              <td className="px-3 py-2.5 tabular-nums">{row.sent}</td>
              <td className="px-3 py-2.5 tabular-nums">{row.replies}</td>
              <td className="px-3 py-2.5 tabular-nums">{row.meetings}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </Panel>
    </div>
  );
}

function Pipeline() {
  const { pipeline } = useDeskData();
  if (pipeline.length === 0) {
    return (
      <DeskEmptyState
        title="Your pipeline is empty"
        description="Qualified prospects and their real outcomes will build this pipeline."
      />
    );
  }
  const max = pipeline[0]?.count ?? 1;
  return (
    <div className="grid w-full gap-2 md:grid-cols-2 xl:grid-cols-3">
      {pipeline.map((stage) => (
        <div key={stage.stage} className="rounded-xl bg-card px-3 py-2.5 ring-1 ring-border">
          <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
            <span className="font-medium">{stage.stage}</span>
            <span className="tabular-nums text-muted-foreground">
              {stage.count} · {stage.rate}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(8, (stage.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Tasks() {
  const { tasks } = useDeskData();
  if (tasks.length === 0) {
    return (
      <DeskEmptyState
        title="No open tasks"
        description="Ask the chat to schedule a real follow-up, review, or research task."
      />
    );
  }
  return (
    <Panel>
      <ul className="divide-y divide-border">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3 px-3 py-2.5 text-[13px]">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground">
              {task.kind}
            </span>
            <span className="min-w-0 flex-1 truncate">{task.title}</span>
            <span className="text-[12px] text-muted-foreground">{task.recurrence && task.recurrence !== "none" ? task.recurrence : task.when}</span>
            <span className="text-[11px] capitalize text-muted-foreground">{task.status}</span>
            <TaskActions taskId={task.id} status={task.status} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Performance() {
  const { bars, campaigns } = useDeskData();
  if (bars.length === 0 && campaigns.length === 0) {
    return (
      <DeskEmptyState
        title="No performance data yet"
        description="Metrics will appear after connected campaign tools report actual sends, replies, and meetings."
      />
    );
  }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sent = campaigns.reduce((sum, row) => sum + row.sent, 0);
  const replies = campaigns.reduce((sum, row) => sum + row.replies, 0);
  const meetings = campaigns.reduce((sum, row) => sum + row.meetings, 0);
  return (
    <div className="grid w-full gap-3 md:grid-cols-3">
      {[
        ["Sent", String(sent)],
        ["Replies", String(replies)],
        ["Meetings", String(meetings)],
      ].map(([label, value]) => (
        <div key={label} className="rounded-xl bg-card px-3 py-3 ring-1 ring-border">
          <div className="text-[11.5px] text-muted-foreground">{label}</div>
          <div className="mt-1 text-[22px] font-medium tabular-nums tracking-tight">{value}</div>
        </div>
      ))}
      <div className="rounded-xl bg-card p-3 ring-1 ring-border md:col-span-3">
        <div className="mb-3 text-[12px] text-muted-foreground">Sends this week</div>
        <div className="flex h-24 items-end gap-3">
          {bars.map((value, index) => (
            <div key={days[index]} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full max-w-8 rounded-sm bg-primary/80"
                style={{ height: `${value * 2.4}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{days[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
