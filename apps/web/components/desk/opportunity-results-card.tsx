"use client";

import {
  IconBriefcaseFilled,
  IconChevronDown,
  IconCircleCheckFilled,
  IconExternalLink,
  IconMapPinFilled,
} from "@tabler/icons-react";

import { openLeadPanel } from "@/lib/artifact-panel";
import { THREAD_ANALYSIS_WIDTH } from "@/lib/thread-layout";
import { cn } from "@/lib/utils";

type ScoreBreakdown = {
  criterion: string;
  points: number;
  maxPoints: number;
  reason: string;
};

type OpportunityRow = {
  title: string;
  organization: string;
  subtitle?: string;
  location?: string;
  sourceUrl: string;
  sourceStatus?: "live" | "stale" | "unknown";
  evidence?: string[];
  details?: {
    salary?: string;
    locationMode?: string;
    employmentType?: string;
    deadline?: string;
    skills?: string[];
    personName?: string;
    email?: string;
    checkSize?: string;
    thesis?: string;
    stageFocus?: string;
    portfolioConflict?: string;
    partnershipType?: string;
    mutualValue?: string;
    buyerRole?: string;
    buyingSignal?: string;
  };
  score: number;
  scoreLabel: string;
  scoreBreakdown?: ScoreBreakdown[];
  stage: string;
};

type OpportunityResults = {
  title?: string;
  agent?: string;
  source?: { provider?: string; capturedAt?: number };
  rows?: OpportunityRow[];
  changes?: { created?: number; updated?: number; unchanged?: number };
};

function parseResults(text?: string): OpportunityResults | null {
  if (!text) return null;
  try {
    const value = JSON.parse(text) as OpportunityResults;
    return Array.isArray(value.rows) ? value : null;
  } catch {
    return null;
  }
}

function scoreTone(score: number) {
  if (score >= 75) return "bg-primary/12 text-primary";
  if (score >= 50) return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
}

function sourceLabel(provider?: string) {
  if (!provider) return "Live source";
  return provider.replace(/[_-]+/gu, " ");
}

export function OpportunityResultsCard({
  title,
  text,
}: {
  title?: string;
  text?: string;
}) {
  const data = parseResults(text);
  if (!data || !data.rows?.length) return null;
  const rows = data.rows;
  const created = data.changes?.created ?? 0;
  const updated = data.changes?.updated ?? 0;

  return (
    <section
      className={cn(
        THREAD_ANALYSIS_WIDTH,
        "my-3 overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.03)] dark:shadow-[0_0_0_1px_var(--border)]",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[12px]/5 font-medium text-muted-foreground">
            <IconCircleCheckFilled
              size={14}
              className="text-primary"
              aria-hidden="true"
            />
            {rows.length} source-backed{" "}
            {rows.length === 1 ? "match" : "matches"}
          </div>
          <h3 className="truncate text-[14px]/5 font-semibold text-foreground">
            {data.title || title || "Opportunities"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {(created > 0 || updated > 0) && (
            <span className="text-[12px]/5 tabular-nums text-muted-foreground">
              {created > 0 ? `${created} added` : ""}
              {created > 0 && updated > 0 ? " · " : ""}
              {updated > 0 ? `${updated} refreshed` : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => openLeadPanel("opportunities")}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px]/5 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open pipeline
            <IconExternalLink size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[780px] table-fixed border-separate border-spacing-0 text-left text-[12.5px]/5">
          <thead className="bg-muted/35 text-[11px]/4 font-medium tracking-[0.025em] text-muted-foreground">
            <tr>
              <th className="w-[42%] border-r border-b border-border px-4 py-2.5 font-medium">
                Opportunity
              </th>
              <th className="w-[17%] border-r border-b border-border px-3 py-2.5 font-medium">
                Fit
              </th>
              <th className="w-[19%] border-r border-b border-border px-3 py-2.5 font-medium">
                Stage
              </th>
              <th className="w-[22%] border-b border-border px-3 py-2.5 font-medium">
                Source
              </th>
            </tr>
          </thead>
          {rows.map((row) => (
            <OpportunityTableGroup
              key={`${row.sourceUrl}-${row.title}`}
              row={row}
              provider={data.source?.provider}
            />
          ))}
        </table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <OpportunityMobileRow
            key={`${row.sourceUrl}-${row.title}`}
            row={row}
            provider={data.source?.provider}
          />
        ))}
      </div>
    </section>
  );
}

function OpportunityTableGroup({
  row,
  provider,
}: {
  row: OpportunityRow;
  provider?: string;
}) {
  return (
    <tbody className="group/result-row">
      <tr className="align-top transition-colors duration-150 hover:bg-muted/20">
        <td className="border-r border-border px-4 pt-3 pb-2">
          <OpportunityIdentity row={row} />
        </td>
        <td className="border-r border-border px-3 pt-3 pb-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 font-semibold tabular-nums ${scoreTone(row.score)}`}
          >
            {row.score}% · {row.scoreLabel}
          </span>
        </td>
        <td className="border-r border-border px-3 pt-3 pb-2 text-muted-foreground">
          {row.stage}
        </td>
        <td className="px-3 pt-3 pb-2">
          <SourceLink row={row} provider={provider} />
        </td>
      </tr>
      <tr>
        <td
          colSpan={4}
          className="border-b border-border px-4 pt-0 pb-3 group-last/result-row:border-b-0"
        >
          <MatchRationale row={row} />
        </td>
      </tr>
    </tbody>
  );
}

function OpportunityMobileRow({
  row,
  provider,
}: {
  row: OpportunityRow;
  provider?: string;
}) {
  return (
    <article className="px-4 py-3">
      <OpportunityIdentity row={row} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[12px]/5 font-semibold tabular-nums ${scoreTone(row.score)}`}
        >
          {row.score}% · {row.scoreLabel}
        </span>
        <span className="text-[12px]/5 text-muted-foreground">{row.stage}</span>
      </div>
      <div className="mt-2">
        <SourceLink row={row} provider={provider} />
      </div>
      <MatchRationale row={row} />
    </article>
  );
}

function OpportunityIdentity({ row }: { row: OpportunityRow }) {
  return (
    <div className="min-w-0">
      <a
        href={row.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex max-w-full items-center gap-1 font-semibold text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate">{row.title}</span>
        <IconExternalLink
          size={13}
          className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-px group-hover:translate-x-px"
          aria-hidden="true"
        />
      </a>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]/5 text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <IconBriefcaseFilled size={12} aria-hidden="true" />
          {row.organization}
        </span>
        {row.location && (
          <span className="inline-flex items-center gap-1">
            <IconMapPinFilled size={12} aria-hidden="true" />
            {row.location}
          </span>
        )}
      </div>
      {row.subtitle && (
        <p className="mt-1 line-clamp-2 text-[12px]/5 text-muted-foreground">
          {row.subtitle}
        </p>
      )}
    </div>
  );
}

function SourceLink({
  row,
  provider,
}: {
  row: OpportunityRow;
  provider?: string;
}) {
  return (
    <a
      href={row.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 text-[12px]/5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={row.sourceUrl}
    >
      {row.sourceStatus === "live" && (
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
      )}
      <span className="truncate capitalize">{sourceLabel(provider)}</span>
      <IconExternalLink size={12} className="shrink-0" aria-hidden="true" />
    </a>
  );
}

function MatchRationale({ row }: { row: OpportunityRow }) {
  const evidence = row.evidence ?? [];
  const breakdown = row.scoreBreakdown ?? [];
  const salary = row.details?.salary ?? row.details?.checkSize;
  if (evidence.length === 0 && breakdown.length === 0 && !salary) return null;

  return (
    <details className="group mt-2 text-[12px]/5">
      <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 border-t border-border pt-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-medium text-foreground">Why this fits</span>
          <span className="truncate">
            {breakdown.length > 0
              ? `${breakdown.length} scored signals`
              : `${evidence.length} evidence points`}
          </span>
        </span>
        <IconChevronDown
          size={14}
          className="shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="mt-2 grid gap-5 border-l-2 border-primary/20 pl-3.5 text-muted-foreground md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
        <EvidenceList evidence={evidence} salary={salary} />
        <SignalBreakdown breakdown={breakdown} />
      </div>
    </details>
  );
}

function EvidenceList({
  evidence,
  salary,
}: {
  evidence: string[];
  salary?: string;
}) {
  if (evidence.length === 0 && !salary) return null;
  return (
    <div className="min-w-0">
      <div className="mb-2 text-[11px]/4 font-semibold tracking-[0.05em] text-muted-foreground uppercase">
        Source evidence
      </div>
      {salary && (
        <p className="mb-2 font-semibold text-foreground tabular-nums">
          {salary}
        </p>
      )}
      <ul className="space-y-1.5">
        {evidence.slice(0, 5).map((item) => (
          <li key={item} className="flex gap-2 text-wrap-pretty">
            <IconCircleCheckFilled
              size={13}
              className="mt-0.75 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignalBreakdown({ breakdown }: { breakdown: ScoreBreakdown[] }) {
  if (breakdown.length === 0) return null;
  return (
    <div className="min-w-0">
      <div className="mb-2 text-[11px]/4 font-semibold tracking-[0.05em] text-muted-foreground uppercase">
        Profile fit
      </div>
      <div className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
        {breakdown.map((signal) => (
          <div key={signal.criterion} className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-foreground capitalize">
                {signal.criterion}
              </span>
              <span className="shrink-0 tabular-nums">
                {signal.points}/{signal.maxPoints}
              </span>
            </div>
            <SignalMeter points={signal.points} maxPoints={signal.maxPoints} />
            <p className="mt-1 line-clamp-2 text-wrap-pretty">
              {signal.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalMeter({
  points,
  maxPoints,
}: {
  points: number;
  maxPoints: number;
}) {
  return (
    <div
      className="mt-1 flex gap-0.5"
      aria-label={`${points} out of ${maxPoints}`}
    >
      {Array.from({ length: maxPoints }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1 flex-1 rounded-full",
            index < points ? "bg-primary" : "bg-foreground/10",
          )}
        />
      ))}
    </div>
  );
}
