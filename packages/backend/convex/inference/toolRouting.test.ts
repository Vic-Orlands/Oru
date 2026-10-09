import { describe, expect, it } from "vitest";

import { chooseInitialToolRoute } from "./toolRouting";

const capabilities = {
  connectedIntegrations: [] as string[],
  exaEnabled: true,
  parallelEnabled: true,
  browserEnabled: true,
};

describe("chooseInitialToolRoute", () => {
  it("routes private GitHub data to an unconnected integration", () => {
    expect(
      chooseInitialToolRoute({
        ...capabilities,
        text: "Check my GitHub and find pending PRs in any of my repos",
      }),
    ).toMatchObject({ kind: "integration", integration: "GitHub" });
  });

  it("uses a connected integration for account data", () => {
    expect(
      chooseInitialToolRoute({
        ...capabilities,
        connectedIntegrations: ["GitHub Cloud"],
        text: "Check my GitHub pull requests",
      }),
    ).toMatchObject({ kind: "integration", connectedName: "GitHub Cloud" });
  });

  it("routes rendered-page inspection to the browser", () => {
    expect(
      chooseInitialToolRoute({
        ...capabilities,
        text: "Inspect the fonts used on https://mezie.dev",
      }),
    ).toEqual({ kind: "browser" });
  });

  it("routes an exact public page to fetch", () => {
    expect(
      chooseInitialToolRoute({
        ...capabilities,
        text: "Summarize https://example.com/launch",
      }),
    ).toEqual({ kind: "fetch" });
  });

  it("routes broad discovery to Parallel", () => {
    expect(
      chooseInitialToolRoute({
        ...capabilities,
        text: "Research and compare the best CRM alternatives for startups",
      }),
    ).toEqual({ kind: "research" });
  });

  it("does not connect email merely to draft one", () => {
    expect(
      chooseInitialToolRoute({
        ...capabilities,
        text: "Write a concise follow-up email for this proposal",
      }),
    ).toEqual({ kind: "none" });
  });

  it("connects Gmail when the user asks to send", () => {
    expect(
      chooseInitialToolRoute({
        ...capabilities,
        text: "Send this email through Gmail",
      }),
    ).toMatchObject({ kind: "integration", integration: "Gmail" });
  });
});
