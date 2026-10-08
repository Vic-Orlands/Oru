import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const appUrl =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/+$/, "") ??
  "http://localhost:3000";

/** Shares the Better Auth session and Convex token flow used by apps/v2. */
export const authClient = createAuthClient({
  baseURL: appUrl,
  plugins: [convexClient()],
});
