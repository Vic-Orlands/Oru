/** Demo mode lets the desk be explored before Google, OpenRouter, and Composio keys exist. */
export function isDemoMode(): boolean {
  const flag = process.env.NEXT_PUBLIC_DEMO_MODE;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}
