import type { Metadata, Viewport } from "next";
import { InlineScript } from "@/components/inline-script";
import { ViewportInsets } from "@/components/mobile/viewport-insets";
import { ThemeSync } from "@/components/theme-sync";
import { PerformanceInsights } from "@/components/performance-insights";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { ThemeColor } from "@/components/pwa/theme-color";
import { SupportMount } from "@/components/support/support-mount";
import { WebVitals } from "@/lib/axiom/client";
import {
  SIDEBAR_BOOT_SCRIPT,
  THEME_BOOT_SCRIPT,
  TINT_BOOT_SCRIPT,
} from "@/lib/boot-scripts";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE_PATH,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";
import "streamdown/styles.css";
import { Providers } from "./providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "AI chat",
    "AI assistant",
    "AI models",
    "AI memory",
    "living documents",
    "data visualization",
  ],
  authors: [
    { name: "Oso-Ahia" },
    { name: "Anterra", url: "https://anterra.sh" },
  ],
  creator: "Oso-Ahia",
  publisher: "Oso-Ahia",
  category: "technology",
  /* Installed on an iPhone, Oso-Ahia opens without Safari's chrome and titles
     its own home screen icon. The status bar is left on `default` so it
     takes its colour from the theme-color tag, which tracks the app's
     actual theme (components/pwa/theme-color.tsx) — `black-translucent`
     would hand us a permanently white status bar over a dark app. */
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  /* Phone numbers in a reply are prose, not calls to make. */
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: DEFAULT_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: OG_IMAGE_PATH, alt: DEFAULT_TITLE }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Draw into the notch and the home indicator's strip rather than letting
     the OS letterbox the app between them — every surface that reaches an
     edge pads itself back off with env(safe-area-inset-*). */
  viewportFit: "cover",
  /* Both platforms keep their layout viewport when the keyboard opens, and
     the shell subtracts a measured inset instead
     (components/mobile/viewport-insets.tsx). `resizes-content` would have
     Android shrink the layout viewport for free — but then only iOS reports
     a keyboard, and every rule that wants to know whether one is up needs
     writing twice. One measurement, one answer, both platforms. */
  interactiveWidget: "resizes-visual",
  /* Zoom stays available. It is an accessibility affordance, iOS ignores
     attempts to take it away, and nothing about pinching a conversation is
     un-app-like. */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#181818" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-accent="copper"
      className="h-full antialiased"
    >
      <head>
        {/* Stored theme, accent, canvas tint and sidebar geometry, painted
            during HTML parsing so a dark-mode load never flashes light, a
            grape build never flashes graphite, a tinted canvas never
            flashes neutral, and the shell never jumps width. The scripts
            themselves are fixed strings in lib/boot-scripts.ts — see the
            note there on why that matters. */}
        <InlineScript html={THEME_BOOT_SCRIPT} />
        <InlineScript html={TINT_BOOT_SCRIPT} />
        <InlineScript html={SIDEBAR_BOOT_SCRIPT} />
      </head>
      <body className="h-full">
        <ThemeSync />
        <WebVitals />
        <PerformanceInsights />
        <ThemeColor />
        <ViewportInsets />
        <ServiceWorker />
        <Providers>{children}</Providers>
        {/* Outside the shell on purpose. /pricing, /about and /platinum are
            their own routes, so a panel mounted in AppShell was destroyed the
            moment the agent's goToPage sent somebody to one. The support
            agent is optional: only a boolean crosses to the client, never
            the key. */}
        <SupportMount enabled={Boolean(process.env.MEDIAN_KEY)} />
      </body>
    </html>
  );
}
