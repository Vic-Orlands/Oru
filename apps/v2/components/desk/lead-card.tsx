"use client";

import { IconArrowUpRight, IconCircleCheckFilled } from "@tabler/icons-react";

import { openLeadPanel } from "@/lib/artifact-panel";
import { showToast } from "@/lib/toasts";

type ProspectRow = {
  name: string;
  title: string;
  company: string;
  score: number;
  fit: string;
};

type SequenceStep = { day: number; channel: string; subject: string };

type Approval = {
  to: string;
  company: string;
  subject: string;
  preview: string;
  step: string;
  sequence: string;
};

function parse<T>(text: string | undefined): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function LeadPhaseCard({
  title,
  text,
  name,
}: {
  title?: string;
  text?: string;
  name?: string;
}) {
  if (name === "sequence") return <SequenceCard text={text} />;
  if (name === "approval") return <ApprovalCard text={text} />;
  return <ProspectCard title={title} text={text} />;
}

function CardShell({
  kicker,
  title,
  children,
  onOpen,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  onOpen?: () => void;
}) {
  return (
    <div className="my-2 overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {kicker}
          </div>
          <div className="truncate text-[13.5px] font-medium">{title}</div>
        </div>
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Open
            <IconArrowUpRight size={13} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ProspectCard({ title, text }: { title?: string; text?: string }) {
  const data = parse<{ title: string; rows: ProspectRow[] }>(text);
  const rows = data?.rows ?? [];
  return (
    <CardShell
      kicker="Prospects"
      title={data?.title || title || "List"}
      onOpen={() => openLeadPanel("prospects")}
    >
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{row.name}</div>
              <div className="truncate text-[12px] text-muted-foreground">
                {row.title} · {row.company}
              </div>
            </div>
            <span className="text-[12px] tabular-nums text-muted-foreground">{row.score}</span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px]">{row.fit}</span>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function SequenceCard({ text }: { text?: string }) {
  const data = parse<{ name: string; steps: SequenceStep[] }>(text);
  return (
    <CardShell
      kicker="Sequence"
      title={data?.name || "Sequence"}
      onOpen={() => openLeadPanel("sequence")}
    >
      <ol className="flex flex-col gap-1.5 px-3 py-2.5">
        {(data?.steps ?? []).map((step) => (
          <li key={step.subject} className="flex items-baseline gap-2 text-[12.5px]">
            <span className="w-12 shrink-0 tabular-nums text-muted-foreground">Day {step.day}</span>
            <span className="w-16 shrink-0 text-muted-foreground">{step.channel}</span>
            <span className="min-w-0 truncate">{step.subject}</span>
          </li>
        ))}
      </ol>
    </CardShell>
  );
}

function ApprovalCard({ text }: { text?: string }) {
  const draft = parse<Approval>(text);
  if (!draft) return null;
  return (
    <CardShell
      kicker="Needs your yes"
      title={draft.subject}
      onOpen={() => openLeadPanel("approval")}
    >
      <div className="px-3 py-2.5">
        <div className="text-[12px] text-muted-foreground">
          To {draft.to} · {draft.company} · {draft.step}
        </div>
        <p className="mt-1.5 text-[13px]/5">{draft.preview}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => showToast("Approved. It sends on the next pass.")}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[12px] font-medium text-primary-foreground"
          >
            <IconCircleCheckFilled size={13} />
            Approve
          </button>
          <button
            type="button"
            onClick={() => showToast("Held. Nothing was sent.")}
            className="rounded-lg px-2.5 py-1 text-[12px] text-muted-foreground ring-1 ring-border hover:bg-accent"
          >
            Hold
          </button>
        </div>
      </div>
    </CardShell>
  );
}
