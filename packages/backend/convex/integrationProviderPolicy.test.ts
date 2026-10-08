import { describe, expect, it } from "vitest";

import { isPlatformManagedToolkit } from "./integrationProviderPolicy";

describe("isPlatformManagedToolkit", () => {
  it.each([
    "exa",
    "parallel",
    "supermemory",
    "openrouter",
    "cloudflare-r2",
    "resend",
    "convex",
    "postgresql",
  ])("keeps %s out of Composio", (slug) => {
    expect(isPlatformManagedToolkit(slug)).toBe(true);
  });

  it.each(["gmail", "googlecalendar", "googledrive", "slack", "notion"])(
    "keeps the user-scoped %s integration available",
    (slug) => {
      expect(isPlatformManagedToolkit(slug)).toBe(false);
    },
  );
});
