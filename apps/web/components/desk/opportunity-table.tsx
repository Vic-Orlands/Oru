"use client";

import { useMutation } from "convex/react";
import { api } from "@whirl/backend/convex/_generated/api";
import {
  IconExternalLink,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react";

import { useDeskData } from "@/lib/desk-data";
import { leadAgentById, useLeadAgent } from "@/lib/lead-agents";
import { JobApplicationDialog } from "./job-application-dialog";
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

const STAGES = {
  general: ["Saved"],
  sales: ["New", "Qualified", "Sequenced", "Replied", "Meeting", "Won", "Lost"],
  job_hunt: [
    "Discovered",
    "Shortlisted",
    "Applied",
    "Recruiter screen",
    "Interview",
    "Offer",
    "Closed",
  ],
  recruiting: [
    "Sourced",
    "Contacted",
    "Replied",
    "Screen",
    "Interview",
    "Offer",
    "Hired",
    "Closed",
  ],
  partnerships: [
    "Identified",
    "Fit validated",
    "Contacted",
    "Discovery",
    "Proposal",
    "Negotiation",
    "Active",
    "Closed",
  ],
  fundraising: [
    "Researched",
    "Qualified",
    "Intro path",
    "Contacted",
    "Meeting",
    "Diligence",
    "Term sheet",
    "Passed",
    "Closed",
  ],
} as const;

export function OpportunityTable() {
  const { opportunities } = useDeskData();
  const agentId = useLeadAgent();
  const agent = leadAgentById(agentId);
  const setStage = useMutation(api.opportunities.setStage);
  const setFeedback = useMutation(api.opportunities.setFeedback);
  if (opportunities.length === 0) return null;

  return (
    <div>
      <DeskToolbar count={opportunities.length} />
      <DataTableFrame minWidth={agentId === "job_hunt" ? "1040px" : "900px"}>
        <DataTableHead>
          <tr>
            {[
              agent.noun,
              "Organization",
              "Score",
              "Stage",
              "Source",
              "Feedback",
              ...(agentId === "job_hunt" ? ["Application"] : []),
            ].map((label) => (
              <DataTableHeaderCell key={label}>{label}</DataTableHeaderCell>
            ))}
          </tr>
        </DataTableHead>
        <tbody>
          {opportunities.map((row) => (
            <DataTableRow key={row.id}>
              <DataTableCell className="max-w-sm align-top">
                <PrimaryCell
                  title={
                    <a
                      className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.title}
                      <IconExternalLink size={13} aria-hidden="true" />
                    </a>
                  }
                  subtitle={row.subtitle}
                />
                {row.evidence[0] ? (
                  <p className="mt-1 line-clamp-2 text-[11.5px]/4 text-muted-foreground">
                    {row.evidence[0]}
                  </p>
                ) : null}
                {row.changeSummary ? (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    Changed: {row.changeSummary}
                  </p>
                ) : null}
              </DataTableCell>
              <DataTableCell>
                <PrimaryCell title={row.organization} subtitle={row.location} />
              </DataTableCell>
              <DataTableCell>
                <span className="font-semibold tabular-nums">{row.score}</span>
                <div className="text-[11px] text-muted-foreground">
                  {row.scoreLabel}
                </div>
              </DataTableCell>
              <DataTableCell>
                <label className="sr-only" htmlFor={`stage-${row.id}`}>
                  Pipeline stage for {row.title}
                </label>
                <select
                  id={`stage-${row.id}`}
                  value={row.stage}
                  onChange={(event) =>
                    void setStage({ id: row.id, stage: event.target.value })
                  }
                  className="h-8 rounded-md border border-border bg-background px-2 text-[12px] outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {STAGES[agentId].map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </DataTableCell>
              <DataTableCell>
                <StatusPill
                  tone={row.sourceStatus === "live" ? "success" : "warning"}
                  dot
                >
                  <span className="capitalize">{row.sourceStatus}</span>
                </StatusPill>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {row.sourceProvider}
                </div>
              </DataTableCell>
              <DataTableCell>
                <div className="flex gap-1">
                  <button
                    type="button"
                    title="Relevant"
                    aria-label={`Mark ${row.title} relevant`}
                    onClick={() =>
                      void setFeedback({ id: row.id, feedback: "relevant" })
                    }
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <IconThumbUp size={15} />
                  </button>
                  <button
                    type="button"
                    title="Not relevant"
                    aria-label={`Mark ${row.title} not relevant`}
                    onClick={() =>
                      void setFeedback({ id: row.id, feedback: "not_relevant" })
                    }
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <IconThumbDown size={15} />
                  </button>
                </div>
                {row.feedback ? (
                  <div className="mt-1 text-[11px] capitalize text-muted-foreground">
                    {row.feedback.replace("_", " ")}
                  </div>
                ) : null}
              </DataTableCell>
              {agentId === "job_hunt" && (
                <DataTableCell>
                  <JobApplicationDialog
                    opportunityId={row.id}
                    title={row.title}
                    organization={row.organization}
                  />
                </DataTableCell>
              )}
            </DataTableRow>
          ))}
        </tbody>
      </DataTableFrame>
    </div>
  );
}
