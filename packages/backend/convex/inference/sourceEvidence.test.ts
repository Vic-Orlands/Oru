import { describe, expect, it } from "vitest";

import {
  canonicalSourceUrl,
  sourceUrlsFromReceipt,
  verifyReceiptSourceUrl,
} from "./sourceEvidence";

describe("source evidence", () => {
  it("matches harmless URL variants without accepting a different page", () => {
    const receipt = JSON.stringify({
      url: "http://www.example.com/jobs/frontend/?utm_source=exa#apply",
    });

    expect(
      verifyReceiptSourceUrl("https://example.com/jobs/frontend", receipt)
        .normalized,
    ).toBe("https://example.com/jobs/frontend");
    expect(() =>
      verifyReceiptSourceUrl("https://example.com/jobs/backend", receipt),
    ).toThrow(/exact source URLs/u);
  });

  it("extracts links from structured provider receipts", () => {
    expect(
      sourceUrlsFromReceipt(
        '{"url":"https://jobs.example.com/one","text":"See https://example.org/two."}',
      ),
    ).toEqual([
      "https://jobs.example.com/one",
      "https://example.org/two",
    ]);
  });

  it("rejects private and malformed protocols", () => {
    expect(canonicalSourceUrl("javascript:alert(1)")).toBeNull();
    expect(() => verifyReceiptSourceUrl("not a url", "{}")).toThrow(
      /valid public source URL/u,
    );
  });
});
