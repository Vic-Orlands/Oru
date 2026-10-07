"use client";

import { useLayoutEffect } from "react";

import { applyStoredTheme, readTheme, themeIsDark } from "@/lib/theme";

/* React hydration writes the server className back onto <html> and drops
   the `.dark` class the boot script added. Fast routes (/app,
   /integrations) commit after that script, so they were stuck in light
   mode even when localStorage said dark. Re-apply before paint, and put
   the class back if something else strips it later. */
export function ThemeSync() {
  useLayoutEffect(() => {
    applyStoredTheme();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (readTheme() === "system") applyStoredTheme();
    };
    media.addEventListener("change", onSystem);

    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark") !== themeIsDark(readTheme())) {
        applyStoredTheme();
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      media.removeEventListener("change", onSystem);
      observer.disconnect();
    };
  }, []);

  return null;
}
