/**
 * Providers Oso-Ahia calls with deployment-owned credentials. They are part
 * of the product runtime, not apps an end user should install through
 * Composio. Keep aliases here so catalog search and admin provisioning share
 * one boundary even when a provider spells its toolkit slug differently.
 *
 * Google apps are intentionally absent: GOOGLE_CLIENT_* authenticates users
 * into Oso-Ahia, while Gmail/Calendar/Drive integrations require each user's
 * separate consent and data scopes.
 */
const PLATFORM_MANAGED_TOOLKIT_SLUGS = new Set([
  "axiom",
  "better_auth",
  "betterauth",
  "cloudflare",
  "cloudflare_r2",
  "composio",
  "convex",
  "exa",
  "openrouter",
  "parallel",
  "postgres",
  "postgresql",
  "posthog",
  "r2",
  "resend",
  "supermemory",
]);

function normalizeToolkitSlug(slug: string) {
  return slug.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function isPlatformManagedToolkit(slug: string): boolean {
  return PLATFORM_MANAGED_TOOLKIT_SLUGS.has(normalizeToolkitSlug(slug));
}

export function platformManagedToolkitSlugs(): string[] {
  return [...PLATFORM_MANAGED_TOOLKIT_SLUGS];
}
