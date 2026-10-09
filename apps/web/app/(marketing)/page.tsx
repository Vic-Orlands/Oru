import type { Metadata } from "next";

import { OruHome } from "@/components/marketing/oru-home";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Ọru — Find the room. Wait for the yes.",
  description:
    "A chat-first sales desk. Find prospects, qualify them, write the sequence, and send only what you approve.",
  path: "/",
});

export default function MarketingPage() {
  return <OruHome />;
}
