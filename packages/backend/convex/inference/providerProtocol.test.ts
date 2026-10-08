import { describe, expect, it } from "vitest";

import { sanitizeProviderText } from "./providerProtocol";

describe("provider protocol sanitizer", () => {
  it("leaves ordinary replies alone", () => {
    expect(sanitizeProviderText("Here are five verified roles.")).toEqual({
      text: "Here are five verified roles.",
      removedProtocol: false,
    });
  });

  it("removes a complete private tool block and keeps the answer", () => {
    const value =
      'Checking. <|tool_calls_section_begin|><|tool_call_begin|>functions.fileJobOpportunities:1<|tool_call_argument_begin|>{"rows":[]}<|tool_call_end|><|tool_calls_section_end|> Filed the verified matches.';
    expect(sanitizeProviderText(value)).toEqual({
      text: "Checking.  Filed the verified matches.",
      removedProtocol: true,
    });
  });

  it("drops an unterminated protocol tail", () => {
    const value =
      '<|tool_calls_section_begin|><|tool_call_begin|>functions.fileJobOpportunities:1<|tool_call_argument_begin|>{"rows":[';
    expect(sanitizeProviderText(value)).toEqual({
      text: "",
      removedProtocol: true,
    });
  });
});
