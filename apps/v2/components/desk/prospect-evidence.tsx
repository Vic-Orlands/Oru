"use client";

import { IconChevronDown, IconShieldCheckFilled } from "@tabler/icons-react";

type ScoreBreakdown = {
  fit: number;
  timing: number;
  authority: number;
  contactability: number;
};

export function ProspectEvidence({
  provider,
  tool,
  receiptHash,
  capturedAt,
  reason,
  evidence,
  breakdown,
}: {
  provider?: string;
  tool?: string;
  receiptHash?: string;
  capturedAt?: number;
  reason?: string;
  evidence?: string[];
  breakdown?: ScoreBreakdown;
}) {
  return (
    <details className="group mt-1.5 max-w-lg text-[11.5px]/4 text-muted-foreground">
      <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-foreground-soft marker:hidden">
        <IconShieldCheckFilled size={13} className="text-emerald-600 dark:text-emerald-400" />
        Evidence and score
        <IconChevronDown size={12} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 space-y-2 rounded-lg bg-well p-2.5 ring-1 ring-border">
        {breakdown && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 tabular-nums">
            <span>Goal fit <b className="text-foreground">{breakdown.fit}/25</b></span>
            <span>Timing <b className="text-foreground">{breakdown.timing}/25</b></span>
            <span>Authority <b className="text-foreground">{breakdown.authority}/25</b></span>
            <span>Contactability <b className="text-foreground">{breakdown.contactability}/25</b></span>
          </div>
        )}
        {reason && <p>{reason}</p>}
        {evidence && evidence.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-4">
            {evidence.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
        {provider && (
          <p className="break-all text-[10.5px]">
            {provider}{tool ? ` · ${tool}` : ""}
            {capturedAt ? ` · ${new Date(capturedAt).toLocaleString()}` : ""}
            {receiptHash ? ` · receipt ${receiptHash.slice(0, 12)}` : ""}
          </p>
        )}
      </div>
    </details>
  );
}
