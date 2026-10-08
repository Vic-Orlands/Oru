import { describe, expect, it } from "vitest";

import { OPPORTUNITY_PROFILES, scoreOpportunity } from "./opportunityProfiles";

describe("opportunity profiles", () => {
  it("keeps agent stages and rubrics distinct", () => {
    const profiles = Object.values(OPPORTUNITY_PROFILES);
    expect(new Set(profiles.map((profile) => profile.toolName)).size).toBe(5);
    expect(new Set(profiles.map((profile) => profile.stages.join("|"))).size).toBe(5);
    expect(new Set(profiles.map((profile) => profile.criteria.join("|"))).size).toBe(5);
  });

  it("scores the visible rubric deterministically", () => {
    const signals = OPPORTUNITY_PROFILES.job_hunt.criteria.map((criterion) => ({
      criterion,
      level: "strong" as const,
      reason: `${criterion} is supported by the posting.`,
    }));
    expect(scoreOpportunity("job_hunt", signals)).toMatchObject({
      score: 100,
      label: "Strong",
    });
  });

  it("rejects incomplete evidence", () => {
    expect(() => scoreOpportunity("fundraising", [])).toThrow(/Missing investor lead/);
  });
});
