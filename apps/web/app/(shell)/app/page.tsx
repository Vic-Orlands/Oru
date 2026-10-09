import type { Metadata } from "next";

import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Desk · Ọru",
  path: "/app",
});

/* The home face is rendered by the shell layout (always mounted, so the
   page slide can animate); this file just claims the URL. */
export default function Home() {
  return null;
}
