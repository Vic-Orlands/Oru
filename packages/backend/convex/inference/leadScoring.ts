export type LeadScoringSignals = {
  fit: "exact" | "partial" | "weak" | "none";
  timing: "active" | "recent" | "possible" | "none";
  authority: "decision_maker" | "influencer" | "user" | "unknown";
  contactability: "verified_email" | "risky_email" | "profile_only" | "none";
};

export type LeadScoreBreakdown = {
  fit: number;
  timing: number;
  authority: number;
  contactability: number;
};

const POINTS = {
  fit: { exact: 25, partial: 15, weak: 5, none: 0 },
  timing: { active: 25, recent: 15, possible: 8, none: 0 },
  authority: { decision_maker: 25, influencer: 15, user: 8, unknown: 0 },
  contactability: {
    verified_email: 25,
    risky_email: 10,
    profile_only: 8,
    none: 0,
  },
} as const;

export function scoreLead(signals: LeadScoringSignals) {
  const breakdown: LeadScoreBreakdown = {
    fit: POINTS.fit[signals.fit],
    timing: POINTS.timing[signals.timing],
    authority: POINTS.authority[signals.authority],
    contactability: POINTS.contactability[signals.contactability],
  };
  const score = Object.values(breakdown).reduce(
    (total, value) => total + value,
    0,
  );
  return {
    breakdown,
    score,
    fit: score >= 75 ? "Strong" : score >= 50 ? "Possible" : "Weak",
  } as const;
}
