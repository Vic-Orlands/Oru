import { describe, expect, it } from "vitest";

import { followingRun, zonedDateTimeToEpoch } from "./scheduledTasks";

describe("scheduled task recurrence", () => {
  it("keeps the local wall clock across daylight-saving changes", () => {
    const beforeDst = Date.parse("2026-03-07T14:00:00Z"); // 9am New York
    const afterDst = followingRun(beforeDst, "daily", beforeDst, "America/New_York");
    expect(new Date(afterDst!).toISOString()).toBe("2026-03-08T13:00:00.000Z");
  });

  it("does not recur one-off work", () => {
    expect(followingRun(Date.now(), "none", Date.now(), "UTC")).toBeUndefined();
  });

  it("converts the user's wall clock into the correct UTC instant", () => {
    expect(new Date(zonedDateTimeToEpoch("2026-10-08T09:30", "Africa/Lagos")).toISOString()).toBe("2026-10-08T08:30:00.000Z");
    expect(new Date(zonedDateTimeToEpoch("2026-10-08T09:30", "Australia/Sydney")).toISOString()).toBe("2026-10-07T22:30:00.000Z");
  });
});
