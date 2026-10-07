"use client";

import { useState } from "react";
import { IconPlugConnected } from "@tabler/icons-react";

import { isImageLoaded, markImageLoaded } from "@/lib/image-cache";

/* An integration's face, ported lean from v1: the uploaded logo when there
   is one, else the developer's monochrome SVG icon (recolored via CSS
   mask), else a friendly plug. The corner radius scales with the size so
   every size reads the same gently-rounded shape.

   Logos skeleton while their bytes arrive and fade in only once fully
   decoded; URLs that already loaded this session (lib/image-cache.ts)
   paint instantly — no re-shimmer every time a row or modal remounts. */
export function IntegrationLogo({
  name,
  logoUrl,
  iconSvg,
  size = 18,
  className = "",
}: {
  name: string;
  logoUrl: string | null;
  iconSvg?: string;
  size?: number;
  className?: string;
}) {
  /* A logo URL that won't load falls through to the icon tile instead of
     the browser's broken-image glyph. */
  const [failed, setFailed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(() =>
    logoUrl && isImageLoaded(logoUrl) ? logoUrl : null,
  );
  const radius = Math.round(size * 0.22);

  if (logoUrl && !failed) {
    const loaded = loadedSrc === logoUrl || isImageLoaded(logoUrl);
    // decode() resolves only once the image can paint completely (and
    // rejects for a dead URL), so the fade never shows a partial frame.
    const settle = (node: HTMLImageElement) => {
      node.decode().then(
        () => {
          markImageLoaded(logoUrl);
          setLoadedSrc(logoUrl);
        },
        () => setFailed(true),
      );
    };
    return (
      <span
        title={name}
        className={`relative grid shrink-0 place-items-center overflow-hidden bg-white ring-1 ring-black/[0.08] dark:bg-foreground/[0.08] dark:ring-foreground/[0.12] ${className}`}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        {!loaded && (
          <span className="absolute inset-0 block animate-pulse bg-black/[0.05] dark:bg-white/[0.08]" />
        )}
        {/* Arbitrary developer-hosted logo domains — next/image would need
            every one whitelisted. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          draggable={false}
          // Cached images can finish before React wires up onLoad — the
          // ref callback catches those so they never shimmer forever.
          ref={(node) => {
            if (node?.complete && !loaded) settle(node);
          }}
          onLoad={(event) => settle(event.currentTarget)}
          onError={() => setFailed(true)}
          className={`absolute inset-[14%] size-[72%] object-contain object-center transition-opacity duration-300 dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.7)] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </span>
    );
  }

  if (iconSvg) {
    return (
      <span
        aria-hidden
        title={name}
        className={`flex shrink-0 items-center justify-center bg-black/[0.05] text-muted-foreground ring-1 ring-black/[0.06] dark:bg-white/[0.08] dark:ring-white/[0.08] ${className}`}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <span
          className="bg-current"
          style={{
            width: Math.round(size * 0.6),
            height: Math.round(size * 0.6),
            WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(iconSvg)}")`,
            maskImage: `url("data:image/svg+xml,${encodeURIComponent(iconSvg)}")`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </span>
    );
  }

  const label = monogram(name);
  return (
    <span
      aria-hidden
      title={name}
      className={`flex shrink-0 items-center justify-center font-medium tracking-tight text-white ring-1 ring-black/10 dark:ring-white/15 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: tileColor(name),
        fontSize: Math.max(10, Math.round(size * (label.length > 1 ? 0.32 : 0.48))),
      }}
    >
      {label || <IconPlugConnected size={Math.round(size * 0.6)} stroke={2} />}
    </span>
  );
}

/** Stable tile colour so a catalog without hosted logos still reads as a
 *  store, not a column of identical plugs. Known tools get a recognisable
 *  hue; everything else hashes into the same palette. */
const NAMED_TILES: Record<string, string> = {
  HubSpot: "#ff7a59",
  Salesforce: "#00a1e0",
  Pipedrive: "#017737",
  Attio: "#5c6bc0",
  Gmail: "#ea4335",
  Outlook: "#0f6cbd",
  "Google Calendar": "#1a73e8",
  Calendly: "#006bff",
  Apollo: "#e85d04",
  LinkedIn: "#0a66c2",
  Hunter: "#f97316",
  Slack: "#611f69",
  "Google Sheets": "#0f9d58",
  Notion: "#3f3f46",
  "Google Docs": "#4285f4",
};

const TILE_PALETTE = ["#9a3412", "#9f1239", "#1d4e89", "#166534", "#854d0e", "#6d28d9", "#0f766e"];

function tileColor(name: string): string {
  const named = NAMED_TILES[name];
  if (named) return named;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 3)) % TILE_PALETTE.length;
  return TILE_PALETTE[hash] ?? "#9a3412";
}

function monogram(name: string): string {
  const parts = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? "").toUpperCase();
}

/** A console-provided monochrome integration mark without its store tile.
 * Tight activity rows use this so the tool's own face can replace the
 * generic plug without changing the row's geometry. */
export function IntegrationIcon({
  iconSvg,
  size = 16,
  className = "",
}: {
  iconSvg: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(iconSvg)}")`,
        maskImage: `url("data:image/svg+xml,${encodeURIComponent(iconSvg)}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
