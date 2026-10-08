import { describe, expect, it } from "vitest";

import { followingRun } from "./scheduledTasks";

describe("scheduled task recurrence", () => {
  it("keeps the local wall clock across daylight-saving changes", () => {
    const beforeDst = Date.parse("2026-03-07T14:00:00Z"); // 9am New York
    const afterDst = followingRun(beforeDst, "daily", beforeDst, "America/New_York");
    expect(new Date(afterDst!).toISOString()).toBe("2026-03-08T13:00:00.000Z");
  });

  it("does not recur one-off work", () => {
    expect(followingRun(Date.now(), "none", Date.now(), "UTC")).toBeUndefined();
  });
});
