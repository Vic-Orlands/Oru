"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";

import { api } from "@whirl/backend/convex/_generated/api";

const REFRESH_AFTER_MS = 4 * 60 * 1_000;

/** Resolves a private R2 key to a short-lived URL and refreshes it safely. */
export function usePrivateMediaUrl(key?: string) {
  const createDownload = useAction(api.mediaStorage.createMediaDownload);
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!key) {
      setUrl(undefined);
      setError(undefined);
      return;
    }

    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const resolve = async () => {
      try {
        const result = await createDownload({ key });
        if (!active) return;
        setUrl(result.url);
        setError(undefined);
        refreshTimer = setTimeout(resolve, REFRESH_AFTER_MS);
      } catch (caught) {
        if (!active) return;
        setError(
          caught instanceof Error ? caught.message : "This file could not be opened.",
        );
      }
    };

    void resolve();
    return () => {
      active = false;
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [createDownload, key]);

  return { url, error };
}
