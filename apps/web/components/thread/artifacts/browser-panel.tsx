"use client";

import {
  IconArrowUpRight,
  IconBrowser,
  IconCircleCheckFilled,
} from "@tabler/icons-react";

import { closeArtifactPanel } from "@/lib/artifact-panel";
import { CloseButton, FullscreenToggle } from "./artifact-shell";

export function BrowserPanel({
  liveViewUrl,
  url,
  title,
  fullscreen,
}: {
  liveViewUrl: string;
  url: string;
  title?: string;
  fullscreen: boolean;
}) {
  const host = browserHost(url);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-muted-foreground dark:bg-white/[0.06]">
          <IconBrowser size={16} stroke={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13.5px]/4 font-medium">
            {title?.trim() || host}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px]/3 text-muted-foreground">
            <IconCircleCheckFilled
              size={11}
              className="shrink-0 text-emerald-500"
            />
            Secure browser · expires automatically
          </span>
        </span>
        <a
          href={liveViewUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open browser in a new tab"
          title="Open in new tab"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/[0.06]"
        >
          <IconArrowUpRight size={16} stroke={2} />
        </a>
        <FullscreenToggle fullscreen={fullscreen} />
        <CloseButton onClose={closeArtifactPanel} label="Close browser" />
      </header>
      <div className="min-h-0 flex-1 bg-black">
        <iframe
          title={`Browser viewing ${host}`}
          src={liveViewUrl}
          allow="clipboard-read; clipboard-write"
          className="h-full min-h-[420px] w-full bg-background"
        />
      </div>
    </>
  );
}

function browserHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Browser";
  }
}

