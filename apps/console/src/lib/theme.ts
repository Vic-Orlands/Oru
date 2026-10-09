import { CONSOLE_EVENTS, captureEvent } from "~/lib/analytics";

// Same localStorage key and semantics as the main app, so a developer who
// prefers dark mode in Ọru gets it in the console too.
export type ThemePref = "system" | "light" | "dark";

export function resolveDark(pref: ThemePref): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function setThemePref(pref: ThemePref) {
  document.documentElement.classList.toggle("dark", resolveDark(pref));
  try {
    localStorage.setItem("theme", pref);
  } catch {}
  window.dispatchEvent(
    new CustomEvent<ThemePref>("theme-change", { detail: pref }),
  );
  captureEvent(CONSOLE_EVENTS.themeChanged, { theme: pref });
}

export function readThemePref(): ThemePref {
  try {
    const t = localStorage.getItem("theme");
    if (t === "light" || t === "dark" || t === "system") return t;
  } catch {}
  return "system";
}
