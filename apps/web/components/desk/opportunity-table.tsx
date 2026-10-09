"use client";

import { useMutation } from "convex/react";
import { api } from "@whirl/backend/convex/_generated/api";
import { IconExternalLink, IconThumbDown, IconThumbUp } from "@tabler/icons-react";

import { useDeskData } from "@/lib/desk-data";
import { leadAgentById, useLeadAgent } from "@/lib/lead-agents";
import { JobApplicationDialog } from "./job-application-dialog";

const STAGES = {
  general: ["Saved"],
  sales: ["New", "Qualified", "Sequenced", "Replied", "Meeting", "Won", "Lost"],
  job_hunt: ["Discovered", "Shortlisted", "Applied", "Recruiter screen", "Interview", "Offer", "Closed"],
  recruiting: ["Sourced", "Contacted", "Replied", "Screen", "Interview", "Offer", "Hired", "Closed"],
  partnerships: ["Identified", "Fit validated", "Contacted", "Discovery", "Proposal", "Negotiation", "Active", "Closed"],
  fundraising: ["Researched", "Qualified", "Intro path", "Contacted", "Meeting", "Diligence", "Term sheet", "Passed", "Closed"],
} as const;

export function OpportunityTable() {
  const { opportunities } = useDeskData();
  const agentId = useLeadAgent();
  const agent = leadAgentById(agentId);
  const setStage = useMutation(api.opportunities.setStage);
  const setFeedback = useMutation(api.opportunities.setFeedback);
  if (opportunities.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
      <table className="w-full min-w-[820px] text-left text-[12.5px]">
        <thead className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
          <tr>{[agent.noun, "Organization", "Score", "Stage", "Source", "Feedback", ...(agentId === "job_hunt" ? ["Application"] : [])].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr>
        </thead>
        <tbody>
          {opportunities.map((row) => (
            <tr key={row.id} className="border-b border-border align-top last:border-0">
              <td className="max-w-sm px-3 py-3">
                <a className="inline-flex items-center gap-1.5 font-medium hover:underline" href={row.sourceUrl} target="_blank" rel="noreferrer">
                  {row.title}<IconExternalLink size={13} aria-hidden="true" />
                </a>
                {row.subtitle && <div className="text-[11.5px] text-muted-foreground">{row.subtitle}</div>}
                {row.evidence[0] && <p className="mt-1 line-clamp-2 text-[11.5px]/4 text-muted-foreground">{row.evidence[0]}</p>}
                {row.changeSummary && <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">Changed: {row.changeSummary}</p>}
              </td>
              <td className="px-3 py-3"><div>{row.organization}</div><div className="text-[11.5px] text-muted-foreground">{row.location}</div></td>
              <td className="px-3 py-3"><span className="font-medium tabular-nums">{row.score}</span><div className="text-[11px] text-muted-foreground">{row.scoreLabel}</div></td>
              <td className="px-3 py-3">
                <label className="sr-only" htmlFor={`stage-${row.id}`}>Pipeline stage for {row.title}</label>
                <select id={`stage-${row.id}`} value={row.stage} onChange={(event) => void setStage({ id: row.id, stage: event.target.value })} className="rounded-md border border-border bg-background px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {STAGES[agentId].map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </td>
              <td className="px-3 py-3"><div className="capitalize">{row.sourceStatus}</div><div className="text-[11px] text-muted-foreground">{row.sourceProvider}</div></td>
              <td className="px-3 py-3">
                <div className="flex gap-1">
                  <button type="button" title="Relevant" aria-label={`Mark ${row.title} relevant`} onClick={() => void setFeedback({ id: row.id, feedback: "relevant" })} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><IconThumbUp size={15} /></button>
                  <button type="button" title="Not relevant" aria-label={`Mark ${row.title} not relevant`} onClick={() => void setFeedback({ id: row.id, feedback: "not_relevant" })} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><IconThumbDown size={15} /></button>
                </div>
                {row.feedback && <div className="mt-1 text-[11px] text-muted-foreground">{row.feedback.replace("_", " ")}</div>}
              </td>
              {agentId === "job_hunt" && (
                <td className="px-3 py-3">
                  <JobApplicationDialog opportunityId={row.id} title={row.title} organization={row.organization} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
