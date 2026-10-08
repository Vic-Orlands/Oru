import type { Metadata } from "next";

import { PricingPage } from "@/components/pricing/pricing-page";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Plans & Pricing · Oso-Ahia",
  description:
    "Start with Oso-Ahia for free, then upgrade for more usage across the best AI models, memory, living documents, and visualizations.",
  path: "/pricing",
});

export default function Page() {
  return <PricingPage />;
}
