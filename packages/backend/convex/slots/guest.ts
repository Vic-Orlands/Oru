import { ConvexError } from "convex/values";

const REDEMPTION_CODE_PREFIX = "ORU";

/** A 256-bit browser capability. Never put it in URLs, analytics or logs. */
export function guestOwner(key: string | undefined) {
  if (!key || !/^[a-f0-9]{64}$/.test(key))
    throw new ConvexError(
      "Your guest wallet could not be opened. Refresh the arcade and try again.",
    );
  return `guest:${key}`;
}

export function newRedemptionCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${REDEMPTION_CODE_PREFIX}-${hex.match(/.{4}/g)!.join("-")}`;
}

export function normalizeRedemptionCode(code: string) {
  const normalized = code.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!new RegExp(`^${REDEMPTION_CODE_PREFIX}[A-F0-9]{24}$`).test(normalized))
    throw new ConvexError(
      "Enter the complete code from your arcade prize tray.",
    );
  const payload = normalized.slice(REDEMPTION_CODE_PREFIX.length);
  return `${REDEMPTION_CODE_PREFIX}-${payload.match(/.{4}/g)!.join("-")}`;
}
