import { describe, expect, it } from "vitest";

import { leadAgentInstruction, type LeadAgentKind } from "./leadAgents";

const agents: LeadAgentKind[] = [
  "general",
  "sales",
  "job_hunt",
  "recruiting",
  "partnerships",
  "fundraising",
];

describe("leadAgentInstruction", () => {
  it("gives every workspace a distinct operating profile", () => {
    const prompts = agents.map(leadAgentInstruction);
    expect(new Set(prompts).size).toBe(agents.length);
  });

  it("routes job discovery to live web research instead of FuseAI", () => {
    const prompt = leadAgentInstruction("job_hunt");
    expect(prompt).toContain("currently open role");
    expect(prompt).toContain("live Exa or Parallel web research");
    expect(prompt).toContain("FuseAI and sales databases are not job boards");
    expect(prompt).toContain("Discovered, Shortlisted, Applied");
    expect(prompt).toContain("call getAgentProfile");
    expect(prompt).toContain("Do not guess or issue a profile-fit score");
    expect(prompt).toContain("saveAgentProfile");
  });

  it("keeps sales enrichment scoped to sales work", () => {
    const prompt = leadAgentInstruction("sales");
    expect(prompt).toContain("prospective customer account");
    expect(prompt).toContain("verified emails");
    expect(prompt).toContain("Won/Lost");
  });

  it("keeps general work out of lead pipelines", () => {
    const prompt = leadAgentInstruction("general");
    expect(prompt).toContain("not limited to lead workflows");
    expect(prompt).toContain("inspectWebPage");
    expect(prompt).toContain("Do not force ordinary research into prospect records");
  });
});
