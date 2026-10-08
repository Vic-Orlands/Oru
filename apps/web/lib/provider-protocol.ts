const PRIVATE_TOOL_MARKERS = [
  "<|tool_calls_section_begin|>",
  "<|tool_call_begin|>",
] as const;

/** Defensive display boundary for historical messages saved before the
 * backend learned to reject provider-native tool syntax. */
export function hidePrivateProviderProtocol(value: string): string {
  const offsets = PRIVATE_TOOL_MARKERS.map((marker) => value.indexOf(marker))
    .filter((offset) => offset >= 0);
  if (offsets.length === 0) return value;
  return value.slice(0, Math.min(...offsets)).trim();
}
