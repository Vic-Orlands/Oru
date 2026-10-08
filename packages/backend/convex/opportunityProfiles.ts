import type { LeadAgentKind } from "./leadAgents";

export type OpportunityLevel = "strong" | "medium" | "weak" | "unknown";

export type OpportunitySignal = {
  criterion: string;
  level: OpportunityLevel;
  reason: string;
};

type OpportunityProfile = {
  singular: string;
  plural: string;
  toolName: string;
  stages: readonly string[];
  criteria: readonly string[];
};

export const OPPORTUNITY_PROFILES: Record<
  LeadAgentKind,
  OpportunityProfile
> = {
  sales: {
    singular: "sales lead",
    plural: "sales leads",
    toolName: "fileSalesLeads",
    stages: ["New", "Qualified", "Sequenced", "Replied", "Meeting", "Won", "Lost"],
    criteria: ["ICP fit", "buying signal", "authority", "timing", "contactability"],
  },
  job_hunt: {
    singular: "job opportunity",
    plural: "job opportunities",
    toolName: "fileJobOpportunities",
    stages: ["Discovered", "Shortlisted", "Applied", "Recruiter screen", "Interview", "Offer", "Closed"],
    criteria: ["skills fit", "seniority fit", "location fit", "compensation fit", "posting recency", "referral access"],
  },
  recruiting: {
    singular: "candidate",
    plural: "candidates",
    toolName: "fileCandidates",
    stages: ["Sourced", "Contacted", "Replied", "Screen", "Interview", "Offer", "Hired", "Closed"],
    criteria: ["required skills", "relevant experience", "evidence quality", "availability", "location fit", "compensation fit"],
  },
  partnerships: {
    singular: "partnership opportunity",
    plural: "partnership opportunities",
    toolName: "filePartnerships",
    stages: ["Identified", "Fit validated", "Contacted", "Discovery", "Proposal", "Negotiation", "Active", "Closed"],
    criteria: ["audience overlap", "product complementarity", "strategic value", "timing", "execution simplicity", "stakeholder access"],
  },
  fundraising: {
    singular: "investor lead",
    plural: "investor leads",
    toolName: "fileInvestors",
    stages: ["Researched", "Qualified", "Intro path", "Contacted", "Meeting", "Diligence", "Term sheet", "Passed", "Closed"],
    criteria: ["thesis fit", "stage fit", "check-size fit", "geography fit", "portfolio conflict", "partner relevance", "recent activity"],
  },
};

const LEVEL_POINTS: Record<OpportunityLevel, number> = {
  strong: 5,
  medium: 3,
  weak: 1,
  unknown: 0,
};

export function scoreOpportunity(
  agent: LeadAgentKind,
  signals: OpportunitySignal[],
) {
  const profile = OPPORTUNITY_PROFILES[agent];
  const normalized = new Map(
    signals.map((signal) => [signal.criterion.trim().toLowerCase(), signal]),
  );
  const breakdown = profile.criteria.map((criterion) => {
    const signal = normalized.get(criterion.toLowerCase());
    if (!signal) {
      throw new Error(`Missing ${profile.singular} score criterion: ${criterion}.`);
    }
    return {
      criterion,
      points: LEVEL_POINTS[signal.level],
      maxPoints: 5,
      reason: signal.reason,
    };
  });
  const unknown = signals.find(
    (signal) =>
      !profile.criteria.some(
        (criterion) => criterion.toLowerCase() === signal.criterion.trim().toLowerCase(),
      ),
  );
  if (unknown) {
    throw new Error(`Unknown ${profile.singular} score criterion: ${unknown.criterion}.`);
  }
  const raw = breakdown.reduce((total, item) => total + item.points, 0);
  const maximum = breakdown.length * 5;
  const score = Math.round((raw / maximum) * 100);
  return {
    score,
    label: score >= 75 ? "Strong" : score >= 50 ? "Possible" : "Weak",
    breakdown,
  } as const;
}

export function opportunityStage(agent: LeadAgentKind, requested?: string) {
  const stages = OPPORTUNITY_PROFILES[agent].stages;
  if (!requested) return stages[0];
  return stages.find((stage) => stage.toLowerCase() === requested.toLowerCase()) ?? stages[0];
}
