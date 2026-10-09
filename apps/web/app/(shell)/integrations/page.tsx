import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";

/* The integrations store face is rendered by the shell layout (always
   mounted, so the page slide can animate); this route just claims
   /integrations and sets the tab title. Deep links carry ?i=<integration>
   or ?s=<skill> — the client face reads and strips them on mount. */

export const metadata: Metadata = publicPageMetadata({
  title: "Integrations · Ọru",
  description:
    "Browse and install the tools the desk sells with — CRM, mail, calendar, and enrichment.",
  path: "/integrations",
});

export default function IntegrationsPage() {
  return null;
}
