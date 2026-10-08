import type { Metadata } from "next";

import { OsoHome } from "@/components/marketing/oso-home";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Oso-Ahia — Every send waits for a yes.",
  description:
    "A chat desk for outbound. Find the room, score the fit, write the note, and send only what you approve.",
  path: "/",
});

export default function MarketingPage() {
  return <OsoHome />;
}
