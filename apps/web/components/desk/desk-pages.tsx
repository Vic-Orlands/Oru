"use client";

import { useDeskData } from "@/lib/desk-data";
import type { DeskPage } from "@/lib/view";
import {
  IconChartBar,
  IconExternalLink,
  IconMail,
  IconSend,
} from "@tabler/icons-react";
import { ApprovalActions } from "./approval-actions";
import { DeskEmptyState } from "./desk-empty-state";
import { AgentSwitcher } from "@/components/agent-switcher";
import { ProspectEvidence } from "./prospect-evidence";
import { OpportunityTable } from "./opportunity-table";
import { TaskActions } from "./task-actions";
import { ActionApprovalList } from "./action-approval-list";
import { leadAgentById, useLeadAgent } from "@/lib/lead-agents";
import {
  DataTableCell,
  DataTableFrame,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  PrimaryCell,
  StatusPill,
} from "@/components/ui/data-table";
import { DeskToolbar } from "./desk-toolbar";
import { PerformanceChart } from "./performance-chart";

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
    <div className="h-full min-h-0 overflow-y-auto px-5 py-7 md:px-8 lg:px-10">
      <header className="mb-7 flex w-full items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-balance text-[22px] font-semibold tracking-[-0.02em]">
            {copy.title}
          </h1>
          <p className="mt-1 max-w-2xl text-pretty text-[13px]/5 text-muted-foreground">
            {copy.lede}
          </p>
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
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
      {children}
    </div>
  );
}

function statusTone(status?: string) {
  const value = status?.toLowerCase() ?? "";
  if (["active", "live", "completed", "won", "approved"].includes(value)) {
    return "success" as const;
  }
  if (["failed", "lost", "declined", "cancelled", "canceled"].includes(value)) {
    return "danger" as const;
  }
  if (["paused", "pending", "waiting", "stale"].includes(value)) {
    return "warning" as const;
  }
  return "neutral" as const;
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
      {prospects.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {lists.map((list) => (
              <span
                key={list.id}
                className="rounded-full bg-accent px-2.5 py-1 text-[12px]"
              >
                {list.name}
                <span className="ml-1 tabular-nums text-muted-foreground">
                  {list.count}
                </span>
              </span>
            ))}
          </div>
          <div>
            <DeskToolbar count={prospects.length} />
            <DataTableFrame minWidth="760px">
              <DataTableHead>
                <tr className="border-b border-border">
                  {["Name", "Company", "List", "Score", "Fit", "Status"].map(
                    (head) => (
                      <DataTableHeaderCell key={head}>
                        {head}
                      </DataTableHeaderCell>
                    ),
                  )}
                </tr>
              </DataTableHead>
              <tbody>
                {prospects.map((row) => (
                  <DataTableRow key={row.id}>
                    <DataTableCell className="min-w-64 align-top">
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
                      <div className="text-[11.5px] text-muted-foreground">
                        {row.title}
                      </div>
                      <ProspectEvidence
                        provider={row.sourceProvider}
                        tool={row.sourceTool}
                        receiptHash={row.sourceReceiptHash}
                        capturedAt={row.sourceCapturedAt}
                        reason={row.scoreReason}
                        evidence={row.evidence}
                        breakdown={row.scoreBreakdown}
                      />
                    </DataTableCell>
                    <DataTableCell>{row.company}</DataTableCell>
                    <DataTableCell className="text-muted-foreground">
                      {row.list}
                    </DataTableCell>
                    <DataTableCell className="font-medium tabular-nums">
                      {row.score}
                    </DataTableCell>
                    <DataTableCell>{row.fit}</DataTableCell>
                    <DataTableCell>
                      <StatusPill tone={statusTone(row.status)} dot>
                        {row.status}
                      </StatusPill>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </tbody>
            </DataTableFrame>
          </div>
        </>
      )}
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
              <p className="mt-2 text-[13px]/5 text-foreground/90">
                {draft.preview}
              </p>
              <div className="mt-3">
                <ApprovalActions approvalId={draft.id} recipient={draft.to} />
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
    <div className="w-full">
      <DeskToolbar count={campaigns.length} />
      <DataTableFrame minWidth="680px">
        <DataTableHead>
          <tr className="border-b border-border">
            {["Sequence", "Sent", "Replies", "Meetings", "Status"].map(
              (head) => (
                <DataTableHeaderCell key={head}>{head}</DataTableHeaderCell>
              ),
            )}
          </tr>
        </DataTableHead>
        <tbody>
          {campaigns.map((row) => (
            <DataTableRow key={row.name}>
              <DataTableCell>
                <PrimaryCell
                  title={row.name}
                  subtitle={`${row.sent} delivered messages`}
                />
              </DataTableCell>
              <DataTableCell className="tabular-nums">{row.sent}</DataTableCell>
              <DataTableCell className="tabular-nums">
                {row.replies}
              </DataTableCell>
              <DataTableCell className="tabular-nums">
                {row.meetings}
              </DataTableCell>
              <DataTableCell>
                <StatusPill tone={statusTone(row.status)} dot>
                  {row.status}
                </StatusPill>
              </DataTableCell>
            </DataTableRow>
          ))}
        </tbody>
      </DataTableFrame>
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
    <div className="w-full">
      <DeskToolbar count={pipeline.length} />
      <DataTableFrame minWidth="640px">
        <DataTableHead>
          <tr>
            <DataTableHeaderCell>Stage</DataTableHeaderCell>
            <DataTableHeaderCell>Volume</DataTableHeaderCell>
            <DataTableHeaderCell>Conversion</DataTableHeaderCell>
            <DataTableHeaderCell className="w-[42%]">
              Distribution
            </DataTableHeaderCell>
          </tr>
        </DataTableHead>
        <tbody>
          {pipeline.map((stage, index) => (
            <DataTableRow key={stage.stage}>
              <DataTableCell>
                <PrimaryCell
                  title={stage.stage}
                  subtitle={
                    index === 0
                      ? "Pipeline entry"
                      : `From ${pipeline[index - 1]?.stage ?? "previous stage"}`
                  }
                />
              </DataTableCell>
              <DataTableCell className="font-medium tabular-nums">
                {stage.count}
              </DataTableCell>
              <DataTableCell className="tabular-nums text-muted-foreground">
                {stage.rate}
              </DataTableCell>
              <DataTableCell>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 min-w-40 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
                      style={{
                        width: `${Math.max(4, (stage.count / max) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[11.5px] tabular-nums text-muted-foreground">
                    {Math.round((stage.count / max) * 100)}%
                  </span>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
        </tbody>
      </DataTableFrame>
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
    <div>
      <DeskToolbar count={tasks.length} />
      <DataTableFrame minWidth="980px">
        <DataTableHead>
          <tr>
            {[
              "Reference",
              "Task",
              "Next run",
              "Repeats",
              "Last run",
              "Status",
              "Actions",
            ].map((label) => (
              <DataTableHeaderCell key={label}>{label}</DataTableHeaderCell>
            ))}
          </tr>
        </DataTableHead>
        <tbody>
          {tasks.map((task) => (
            <DataTableRow key={task.id}>
              <DataTableCell className="font-mono text-[11px] text-muted-foreground">
                {task.reference}
              </DataTableCell>
              <DataTableCell className="max-w-md">
                <PrimaryCell
                  title={task.title}
                  subtitle={task.instructions ?? task.kind}
                />
              </DataTableCell>
              <DataTableCell className="whitespace-nowrap text-muted-foreground">
                {task.nextRunAt
                  ? new Date(task.nextRunAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </DataTableCell>
              <DataTableCell className="capitalize text-muted-foreground">
                {task.recurrence === "none"
                  ? "Once"
                  : (task.recurrence ?? "Once")}
              </DataTableCell>
              <DataTableCell className="whitespace-nowrap text-muted-foreground">
                {task.lastRunAt
                  ? new Date(task.lastRunAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Never"}
              </DataTableCell>
              <DataTableCell>
                <StatusPill
                  tone={statusTone(task.status)}
                  dot
                  className="capitalize"
                >
                  {task.status ?? "active"}
                </StatusPill>
              </DataTableCell>
              <DataTableCell>
                <TaskActions task={task} />
              </DataTableCell>
            </DataTableRow>
          ))}
        </tbody>
      </DataTableFrame>
    </div>
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
  const sent = campaigns.reduce((sum, row) => sum + row.sent, 0);
  const replies = campaigns.reduce((sum, row) => sum + row.replies, 0);
  const meetings = campaigns.reduce((sum, row) => sum + row.meetings, 0);
  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.75fr)]">
      <section className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.03)] dark:shadow-[0_0_0_1px_var(--border)]">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-medium">Weekly activity</h2>
            <p className="text-[11.5px] text-muted-foreground">
              Verified sends reported by connected tools
            </p>
          </div>
          <StatusPill tone="info" dot>
            Live metrics
          </StatusPill>
        </div>
        <PerformanceChart values={bars} />
      </section>
      <div className="grid gap-2.5">
        {[
          {
            label: "Sent",
            value: sent,
            icon: IconSend,
            detail: "Delivered this period",
          },
          {
            label: "Replies",
            value: replies,
            icon: IconMail,
            detail:
              sent > 0
                ? `${Math.round((replies / sent) * 100)}% reply rate`
                : "No sends yet",
          },
          {
            label: "Meetings",
            value: meetings,
            icon: IconChartBar,
            detail:
              replies > 0
                ? `${Math.round((meetings / replies) * 100)}% of replies`
                : "No replies yet",
          },
        ].map(({ label, value, icon: MetricIcon, detail }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.03)] dark:shadow-[0_0_0_1px_var(--border)]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
              <MetricIcon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] text-muted-foreground">{label}</div>
              <div className="text-[20px] font-semibold tabular-nums tracking-[-0.02em]">
                {value}
              </div>
            </div>
            <span className="max-w-24 text-right text-[10.5px]/4 text-muted-foreground">
              {detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
