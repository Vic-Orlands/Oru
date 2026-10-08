const SECTION_START = "<|tool_calls_section_begin|>";
const SECTION_END = "<|tool_calls_section_end|>";
const TOOL_START = "<|tool_call_begin|>";

export type SanitizedProviderText = {
  text: string;
  removedProtocol: boolean;
};

/**
 * Some OpenAI-compatible routes occasionally emit their private tool grammar
 * as ordinary text instead of a structured tool call. It is never safe or
 * useful to render that protocol (or its JSON arguments) in the transcript.
 */
export function sanitizeProviderText(value: string): SanitizedProviderText {
  if (!value.includes(SECTION_START) && !value.includes(TOOL_START)) {
    return { text: value, removedProtocol: false };
  }

  let text = value;
  let sectionStart = text.indexOf(SECTION_START);
  while (sectionStart >= 0) {
    const sectionEnd = text.indexOf(SECTION_END, sectionStart);
    if (sectionEnd < 0) {
      text = text.slice(0, sectionStart);
      break;
    }
    text = `${text.slice(0, sectionStart)}${text.slice(
      sectionEnd + SECTION_END.length,
    )}`;
    sectionStart = text.indexOf(SECTION_START);
  }

  // A route may omit the outer section markers. In that malformed shape the
  // remainder is arguments, not user-facing prose, so discard the tail.
  const looseToolStart = text.indexOf(TOOL_START);
  if (looseToolStart >= 0) text = text.slice(0, looseToolStart);

  return { text: text.trim(), removedProtocol: true };
}
