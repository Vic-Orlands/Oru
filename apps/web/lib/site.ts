/* Everything that ties this build to one particular Ọru: its address and
   the places it sends people. A fork edits this file and sets
   NEXT_PUBLIC_SITE_URL; nothing else in the app hardcodes a domain.

   The optional links can be set to null, and every surface that shows one
   leaves it out. */

export const SITE_NAME = "Ọru";

/** The public origin, without a trailing slash. When it's unset,
 *  next.config.ts fills it in from Vercel's production domain, or falls
 *  back to localhost. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

type SiteLinks = {
  /** The source code. */
  repo: string | null;
  /** The admin console (apps/console), where integrations and skills are
   *  published. */
  console: string | null;
  status: string | null;
  discord: string | null;
  contactEmail: string | null;
  privacy: string | null;
  terms: string | null;
};

export const SITE_LINKS: SiteLinks = {
  repo: process.env.NEXT_PUBLIC_REPOSITORY_URL?.trim() || null,
  console: process.env.NEXT_PUBLIC_CONSOLE_URL?.trim() || null,
  status: null,
  discord: null,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  privacy: null,
  terms: null,
};

/** "console.example.com" out of "https://console.example.com", for copy. */
export function displayHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
