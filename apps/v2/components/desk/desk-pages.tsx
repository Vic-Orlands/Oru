"use client";

import { useDeskData } from "@/lib/desk-data";
import type { DeskPage } from "@/lib/view";
import { showToast } from "@/lib/toasts";

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
      <header className="mb-5 max-w-2xl">
        <h1 className="text-[20px] font-medium tracking-tight">{copy.title}</h1>
        <p className="mt-1 text-[13px]/5 text-muted-foreground">{copy.lede}</p>
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
  const { lists, prospects } = useDeskData();
  return (
    <div className="flex flex-col gap-4">
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
                  <div className="font-medium">{row.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">{row.title}</div>
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
    </div>
  );
}

function Approvals() {
  const { approvals } = useDeskData();
  return (
    <div className="grid max-w-3xl gap-3">
      {approvals.map((draft) => (
        <Panel key={draft.id}>
          <div className="px-4 py-3">
            <div className="text-[11.5px] text-muted-foreground">
              {draft.sequence} · {draft.step} · {draft.to}, {draft.company}
            </div>
            <h2 className="mt-1 text-[14px] font-medium">{draft.subject}</h2>
            <p className="mt-2 text-[13px]/5 text-foreground/90">{draft.preview}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => showToast(`Approved the note to ${draft.to}.`)}
                className="rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground"
              >
                Approve and queue
              </button>
              <button
                type="button"
                onClick={() => showToast("Held. The sequence waits.")}
                className="rounded-lg px-3 py-1.5 text-[12.5px] ring-1 ring-border"
              >
                Hold
              </button>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function Campaigns() {
  const { campaigns } = useDeskData();
  return (
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
  );
}

function Pipeline() {
  const { pipeline } = useDeskData();
  const max = pipeline[0]?.count ?? 1;
  return (
    <div className="grid max-w-xl gap-2">
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
  return (
    <Panel>
      <ul className="divide-y divide-border">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3 px-3 py-2.5 text-[13px]">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground">
              {task.kind}
            </span>
            <span className="min-w-0 flex-1 truncate">{task.title}</span>
            <span className="text-[12px] text-muted-foreground">{task.when}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Performance() {
  const { bars, campaigns } = useDeskData();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sent = campaigns.reduce((sum, row) => sum + row.sent, 0);
  const replies = campaigns.reduce((sum, row) => sum + row.replies, 0);
  const meetings = campaigns.reduce((sum, row) => sum + row.meetings, 0);
  return (
    <div className="grid max-w-3xl gap-3 md:grid-cols-3">
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
