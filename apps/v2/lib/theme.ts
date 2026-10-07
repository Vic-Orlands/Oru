"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/* Theme lives in localStorage under "theme" (same key as the main app) and
   is applied as a `.dark` class on <html>. A blocking inline script in the
   root layout applies it before first paint; this hook is for switching it
   afterwards. */
export type Theme = "light" | "dark" | "system";

const THEMES: Theme[] = ["light", "dark", "system"];

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    return THEMES.includes(stored as Theme) ? (stored as Theme) : "system";
  } catch {
    return "system";
  }
}

export function themeIsDark(theme: Theme): boolean {
  return (
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", themeIsDark(theme));
}

/** Paint the stored theme onto <html>. Hydration resets the class the
 *  boot script set, so this has to run again after React commits. */
export function applyStoredTheme() {
  applyTheme(readTheme());
}

/* Whether dark mode is currently in effect, tracked live off the `.dark`
   class on <html> — the single place both the pre-paint script and setTheme
   write to. Works regardless of whether the theme is explicit or system. */
export function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useLayoutEffect(() => {
    const stored = readTheme();
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // private mode etc. — the class still applies for this visit
    }
    applyTheme(next);
  };

  return { theme, setTheme };
}
