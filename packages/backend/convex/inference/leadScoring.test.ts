import { describe, expect, it } from "vitest";

import { scoreLead } from "./leadScoring";

describe("lead scoring", () => {
  it("maps the strongest evidence to a strong 100-point lead", () => {
    expect(
      scoreLead({
        fit: "exact",
        timing: "active",
        authority: "decision_maker",
        contactability: "verified_email",
      }),
    ).toEqual({
      breakdown: { fit: 25, timing: 25, authority: 25, contactability: 25 },
      score: 100,
      fit: "Strong",
    });
  });

  it("produces the same score for the same evidence states", () => {
    const signals = {
      fit: "partial",
      timing: "recent",
      authority: "influencer",
      contactability: "profile_only",
    } as const;
    expect(scoreLead(signals)).toEqual(scoreLead(signals));
    expect(scoreLead(signals).score).toBe(53);
    expect(scoreLead(signals).fit).toBe("Possible");
  });
});
