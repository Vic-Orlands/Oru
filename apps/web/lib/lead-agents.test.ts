// @ts-expect-error Bun provides this module to its test runner; the app
// tsconfig intentionally does not include Bun's ambient types.
import { describe, expect, test } from "bun:test";

import { recommendLeadAgent } from "./lead-agents";

describe("lead agent routing", () => {
  test("recommends the single specialist that matches", () => {
    expect(
      recommendLeadAgent("Help me find hiring managers for my job search", "sales"),
    ).toBe("job_hunt");
    expect(
      recommendLeadAgent("Source candidates for our hiring pipeline", "sales"),
    ).toBe("recruiting");
  });

  test("does not interrupt the active specialist", () => {
    expect(
      recommendLeadAgent("Build an investor list for our raise", "fundraising"),
    ).toBeNull();
  });

  test("does not guess when a prompt spans multiple agents", () => {
    expect(
      recommendLeadAgent("Find a sales partner and an investor", "job_hunt"),
    ).toBeNull();
  });
});
