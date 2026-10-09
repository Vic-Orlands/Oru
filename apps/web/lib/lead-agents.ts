"use client";

import { useSyncExternalStore } from "react";

export const LEAD_AGENT_IDS = [
  "general",
  "sales",
  "job_hunt",
  "recruiting",
  "partnerships",
  "fundraising",
] as const;

export type LeadAgentId = (typeof LEAD_AGENT_IDS)[number];

export type LeadAgent = {
  id: LeadAgentId;
  name: string;
  shortName: string;
  description: string;
  noun: string;
  strengths: readonly string[];
};

export const LEAD_AGENTS: LeadAgent[] = [
  {
    id: "general",
    name: "General agent",
    shortName: "General",
    description: "Research, analysis, writing, websites, files, and everyday work.",
    noun: "findings",
    strengths: ["Web research", "Analysis", "Writing and files"],
  },
  {
    id: "sales",
    name: "Sales agent",
    shortName: "Sales",
    description: "Buyers, accounts, outreach, and revenue pipeline.",
    noun: "prospects",
    strengths: ["Account discovery", "Buyer research", "Outreach planning"],
  },
  {
    id: "job_hunt",
    name: "Job Hunt agent",
    shortName: "Job Hunt",
    description: "Roles, employers, networking, and applications.",
    noun: "opportunities",
    strengths: ["Role discovery", "Application support", "Career pipeline"],
  },
  {
    id: "recruiting",
    name: "Recruiting agent",
    shortName: "Recruiting",
    description: "Candidates, sourcing, outreach, and hiring pipeline.",
    noun: "candidates",
    strengths: ["Candidate sourcing", "Fit assessment", "Hiring outreach"],
  },
  {
    id: "partnerships",
    name: "Partnerships agent",
    shortName: "Partnerships",
    description: "Partners, alliances, channels, and ecosystem fit.",
    noun: "partners",
    strengths: ["Partner discovery", "Fit mapping", "Alliance planning"],
  },
  {
    id: "fundraising",
    name: "Fundraising agent",
    shortName: "Fundraising",
    description: "Investors, thesis fit, introductions, and diligence.",
    noun: "investors",
    strengths: ["Investor research", "Thesis matching", "Diligence prep"],
  },
];

const STORAGE_KEY = "oso-lead-agent";
const listeners = new Set<() => void>();
let current: LeadAgentId = "general";
let hydrated = false;

function isLeadAgentId(value: string | null): value is LeadAgentId {
  return LEAD_AGENT_IDS.some((id) => id === value);
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLeadAgentId(stored)) current = stored;
  } catch {
    // Storage can be unavailable in private browsing; the session still works.
  }
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  hydrate();
  return current;
}

export function setLeadAgent(agent: LeadAgentId) {
  hydrate();
  if (current === agent) return;
  current = agent;
  try {
    window.localStorage.setItem(STORAGE_KEY, agent);
  } catch {
    // The in-memory workspace still switches.
  }
  for (const listener of listeners) listener();
}

export function useLeadAgent(): LeadAgentId {
  return useSyncExternalStore(subscribe, snapshot, () => "general");
}

export function leadAgentById(id: LeadAgentId): LeadAgent {
  return LEAD_AGENTS.find((agent) => agent.id === id) ?? LEAD_AGENTS[0];
}

const SIGNALS: Record<LeadAgentId, RegExp> = {
  general: /\b(research|analy[sz]e|write|summari[sz]e|website|webpage|font|document|file|calculate|explain)\b/i,
  sales: /\b(sales|prospect|buyer|customer|outbound|account executive|revenue)\b/i,
  job_hunt:
    /\b(job hunt|job search|jobs?|vacanc(?:y|ies)|open role|my resume|my cv|application|interview prep|hiring manager)\b/i,
  recruiting:
    /\b(recruit|candidate|talent|applicant|source engineers|fill (?:a|the) role|hiring pipeline)\b/i,
  partnerships:
    /\b(partnership|partner|alliance|channel partner|co-marketing|ecosystem)\b/i,
  fundraising:
    /\b(fundrais|investor|venture capital|\bvc\b|angel|pitch deck|raise (?:a|our)|term sheet)\b/i,
};

export function recommendLeadAgent(
  prompt: string,
  active: LeadAgentId,
): LeadAgentId | null {
  const specialistMatches = LEAD_AGENT_IDS.filter(
    (id) => id !== "general" && SIGNALS[id].test(prompt),
  );
  if (specialistMatches.length === 1) {
    return specialistMatches[0] === active ? null : specialistMatches[0];
  }
  if (
    specialistMatches.length === 0 &&
    active !== "general" &&
    SIGNALS.general.test(prompt)
  ) {
    return "general";
  }
  return null;
}
