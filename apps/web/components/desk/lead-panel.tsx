"use client";

import {
  IconExternalLink,
  IconInfoCircle,
  IconLayoutDashboard,
} from "@tabler/icons-react";

import { useDeskData } from "@/lib/desk-data";
import { ApprovalActions } from "./approval-actions";
import { ProspectEvidence } from "./prospect-evidence";

export function LeadPanelBody({ leadId }: { leadId: string }) {
  const desk = useDeskData();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-muted-foreground">
          <IconLayoutDashboard size={16} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px]/6 font-medium">
            {leadId === "approval"
              ? "Email draft"
              : leadId === "sequence"
                ? "Sequence"
                : "Prospect list"}
          </span>
          <span className="text-[13px]/5 text-muted-foreground">Artifact</span>
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-[15px]/6">
        {leadId === "approval" ? (
          <Approval approvals={desk.approvals} />
        ) : leadId === "sequence" ? (
          <SequenceNotice />
        ) : (
          <List rows={desk.prospects} />
        )}
      </div>
    </div>
  );
}

function List({ rows }: { rows: ReturnType<typeof useDeskData>["prospects"] }) {
  if (rows.length === 0) {
    return <EmptyCopy>No prospects have been saved yet.</EmptyCopy>;
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.id} className="py-2">
          <div className="font-medium">{row.name}</div>
          <div className="text-[13px]/5 text-muted-foreground">
            {row.title}, {row.company} · {row.score}
          </div>
          {(row.profileUrl ?? row.sourceUrl) && (
            <a
              href={row.profileUrl ?? row.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[12px]/4 text-muted-foreground hover:text-foreground"
            >
              Open source
              <IconExternalLink size={12} />
            </a>
          )}
          <ProspectEvidence
            provider={row.sourceProvider}
            tool={row.sourceTool}
            receiptHash={row.sourceReceiptHash}
            capturedAt={row.sourceCapturedAt}
            reason={row.scoreReason}
            evidence={row.evidence}
            breakdown={row.scoreBreakdown}
          />
        </li>
      ))}
    </ul>
  );
}

function SequenceNotice() {
  return (
    <EmptyCopy>
      Sequence details stay with the chat that created them. Open the sequence
      card in that conversation to review the real steps.
    </EmptyCopy>
  );
}

function Approval({
  approvals,
}: {
  approvals: ReturnType<typeof useDeskData>["approvals"];
}) {
  const draft = approvals.at(-1);
  if (!draft) return <EmptyCopy>No drafts are waiting for approval.</EmptyCopy>;
  return (
    <div>
      <div className="text-[13px]/5 text-muted-foreground">
        To {draft.to} · {draft.company}
      </div>
      <h2 className="mt-2 text-[15px] font-medium">{draft.subject}</h2>
      <p className="mt-3 text-[15px]/6">{draft.preview}</p>
      <div className="mt-4">
        <ApprovalActions approvalId={draft.id} recipient={draft.to} />
      </div>
    </div>
  );
}

function EmptyCopy({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-well px-3 py-2.5 text-[13px]/5 text-muted-foreground ring-1 ring-border">
      <IconInfoCircle size={16} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
