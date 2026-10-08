"use client";

import {
  IconArrowUpRight,
  IconCircleCheckFilled,
  IconMailFilled,
  IconMapPinFilled,
} from "@tabler/icons-react";

import { openLeadPanel } from "@/lib/artifact-panel";
import { OpportunityResultsCard } from "./opportunity-results-card";

type ProspectRow = {
  name: string;
  title: string;
  company: string;
  score: number;
  fit: string;
  sourceUrl?: string;
  profileUrl?: string;
  companyUrl?: string;
  location?: string;
  email?: string;
  emailVerification?: string;
  scoreReason?: string;
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
  if (name === "opportunities") {
    return <OpportunityResultsCard title={title} text={text} />;
  }
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
          <div className="text-[13px]/5 font-medium text-muted-foreground">
            {kicker}
          </div>
          <div className="truncate text-[15px]/6 font-medium">{title}</div>
        </div>
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[13px]/5 text-muted-foreground hover:bg-accent hover:text-foreground"
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
      <ul
        className={
          rows.length <= 3
            ? "grid gap-2 p-3 sm:grid-cols-2"
            : "divide-y divide-border"
        }
      >
        {rows.map((row) => (
          <li
            key={`${row.name}-${row.company}`}
            className={
              rows.length <= 3
                ? "rounded-xl bg-muted/35 p-3 ring-1 ring-border/70"
                : "flex items-center gap-3 px-3 py-2"
            }
          >
            {rows.length <= 3 && (
              <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-primary/12 text-[12px] font-semibold text-primary ring-1 ring-primary/15">
                {initials(row.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[15px]/6 font-medium">
                  {row.name}
                </span>
                {(row.profileUrl ?? row.sourceUrl) && (
                  <a
                    href={row.profileUrl ?? row.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open source for ${row.name}`}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <IconArrowUpRight size={13} />
                  </a>
                )}
              </div>
              <div className="truncate text-[13px]/5 text-muted-foreground">
                {row.title} · {row.company}
              </div>
              {rows.length <= 3 && (
                <ProspectDetails row={row} />
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 self-start">
              <span className="text-[13px]/5 font-medium tabular-nums text-muted-foreground">
                {row.score}%
              </span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[12px]/5 font-medium">
                {row.fit}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProspectDetails({ row }: { row: ProspectRow }) {
  return (
    <div className="mt-2 space-y-1 text-[12px]/5 text-muted-foreground">
      {row.location && (
        <div className="flex items-center gap-1.5">
          <IconMapPinFilled size={12} aria-hidden="true" />
          <span className="truncate">{row.location}</span>
        </div>
      )}
      {row.email && (
        <div className="flex items-center gap-1.5">
          {row.emailVerification === "verified" ? (
            <IconCircleCheckFilled
              size={12}
              className="text-emerald-500"
              aria-hidden="true"
            />
          ) : (
            <IconMailFilled size={12} aria-hidden="true" />
          )}
          <a
            href={`mailto:${row.email}`}
            className="truncate underline-offset-4 hover:text-foreground hover:underline"
          >
            {row.email}
          </a>
        </div>
      )}
      {row.scoreReason && (
        <p className="line-clamp-2 pt-1 text-foreground/80">
          {row.scoreReason}
        </p>
      )}
    </div>
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
          <li
            key={step.subject}
            className="grid grid-cols-[2.75rem_4.5rem_minmax(0,1fr)] items-baseline gap-2 text-[13px]/5"
          >
            <span className="tabular-nums text-muted-foreground">
              Day {step.day}
            </span>
            <span className="text-muted-foreground">{step.channel}</span>
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
        <div className="text-[13px]/5 text-muted-foreground">
          To {draft.to} · {draft.company} · {draft.step}
        </div>
        <p className="mt-1.5 text-[15px]/6">{draft.preview}</p>
        <p className="mt-3 text-[12px]/4 text-muted-foreground">
          Review this draft in Approvals before anything can proceed.
        </p>
      </div>
    </CardShell>
  );
}
