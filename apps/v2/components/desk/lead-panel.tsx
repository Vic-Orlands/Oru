"use client";

import { IconLayoutDashboard } from "@tabler/icons-react";

import { DEMO_APPROVALS, DEMO_PROSPECTS } from "@/lib/demo/data";
import { showToast } from "@/lib/toasts";

export function LeadPanelBody({ leadId }: { leadId: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-muted-foreground">
          <IconLayoutDashboard size={16} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-medium">
            {leadId === "approval"
              ? "Email draft"
              : leadId === "sequence"
                ? "Clinic revival"
                : "Prospect list"}
          </span>
          <span className="text-[11px] text-muted-foreground">Artifact</span>
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-[13px]">
        {leadId === "approval" ? <Approval /> : leadId === "sequence" ? <Sequence /> : <List />}
      </div>
    </div>
  );
}

function List() {
  const rows = DEMO_PROSPECTS.filter((row) => row.fit === "Strong");
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.id} className="py-2">
          <div className="font-medium">{row.name}</div>
          <div className="text-[12px] text-muted-foreground">
            {row.title}, {row.company} · {row.score}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Sequence() {
  const steps = [
    "Day 0 · Email · A quieter way to fill Thursday’s clinics",
    "Day 3 · Email · The waitlist number, if it’s useful",
    "Day 7 · LinkedIn · A short note, not a pitch",
    "Day 12 · Email · I’ll leave this here",
  ];
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step) => (
        <li key={step} className="rounded-lg bg-accent/60 px-3 py-2 text-[12.5px]">
          {step}
        </li>
      ))}
    </ol>
  );
}

function Approval() {
  const draft = DEMO_APPROVALS[0];
  if (!draft) return null;
  return (
    <div>
      <div className="text-[12px] text-muted-foreground">
        To {draft.to} · {draft.company}
      </div>
      <h2 className="mt-2 text-[15px] font-medium">{draft.subject}</h2>
      <p className="mt-3 text-[13px]/5">{draft.preview}</p>
      <button
        type="button"
        onClick={() => showToast("Approved from the side panel.")}
        className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground"
      >
        Approve and queue
      </button>
    </div>
  );
}
