"use client";

import { useMutation } from "convex/react";
import { api } from "@oru/backend/convex/_generated/api";
import { IconCheck, IconX } from "@tabler/icons-react";

import { useDeskData } from "@/lib/desk-data";

export function ActionApprovalList() {
  const { actionApprovals } = useDeskData();
  const decide = useMutation(api.actionApprovals.decide);
  if (actionApprovals.length === 0) return null;
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {actionApprovals.map((request) => (
        <article key={request.id} className="rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{request.actionType}</div>
          <h2 className="mt-1 text-[14px] font-medium">{request.title}</h2>
          <p className="mt-2 text-[13px]/5 text-foreground/90">{request.summary}</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">Target: {request.target}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => void decide({ id: request.id, decision: "approved" })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><IconCheck size={14} />Approve</button>
            <button type="button" onClick={() => void decide({ id: request.id, decision: "declined" })} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><IconX size={14} />Decline</button>
          </div>
        </article>
      ))}
    </div>
  );
}
