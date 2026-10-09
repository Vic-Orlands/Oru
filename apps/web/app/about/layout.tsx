import type { Metadata } from "next";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: {
    default: "Ọru · A thinking partner that actually cares",
    template: "%s · Ọru",
  },
  description:
    "Ọru is an AI chat app with real memory, the best models, living documents, visualizations, and integrations.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
