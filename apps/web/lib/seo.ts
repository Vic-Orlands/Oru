import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/site";

export { SITE_NAME, SITE_URL } from "@/lib/site";
export const DEFAULT_TITLE =
  "Ọru — The AI sales desk that waits for your yes";
export const DEFAULT_DESCRIPTION =
  "Find prospects, qualify them, write the sequence, and send only what you approve. A chat-first lead desk for people who still want to read the email.";
export const OG_IMAGE_PATH = "/oru-og.png";

export type SocialImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function publicPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
}: {
  title: string;
  description?: string;
  path: string;
  /** A card of the page's own; the site-wide one otherwise. */
  image?: SocialImage;
}): Metadata {
  const card: SocialImage = image ?? {
    url: OG_IMAGE_PATH,
    width: 1200,
    height: 630,
    alt: title,
  };
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [card],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: card.url, alt: card.alt }],
    },
  };
}
