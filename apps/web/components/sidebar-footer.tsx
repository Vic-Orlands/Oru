"use client";

import {
  IconDeviceDesktopFilled,
  IconGiftFilled,
  IconHelpCircleFilled,
  IconMoonFilled,
  IconSettingsFilled,
  IconSunFilled,
  type Icon,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

import { useTheme, type Theme } from "@/lib/theme";
import { openSupport, useSupportAvailable } from "@/lib/support";
import { showToast } from "@/lib/toasts";
import { useView } from "@/lib/view";
import { SidebarRow } from "./sidebar-row";
import { SidebarHoverGroup } from "./sidebar-hover-group";

const THEMES: Array<{ value: Theme; label: string; icon: Icon }> = [
  { value: "light", label: "Light theme", icon: IconSunFilled },
  { value: "system", label: "System theme", icon: IconDeviceDesktopFilled },
  { value: "dark", label: "Dark theme", icon: IconMoonFilled },
];

function SidebarThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="relative grid h-8 grid-cols-3 rounded-lg bg-muted/65 p-1 sidebar-collapsed:hidden"
    >
      {THEMES.map(({ value, label, icon: ThemeIcon }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-label={label}
            aria-checked={selected}
            title={label}
            onClick={() => setTheme(value)}
            className="relative z-0 flex min-w-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected=true]:text-foreground"
            data-selected={selected}
          >
            {selected ? (
              <motion.span
                layoutId="sidebar-theme-thumb"
                aria-hidden
                className="absolute inset-0 -z-10 rounded-sm bg-background shadow-xs"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
                }
              />
            ) : null}
            <ThemeIcon size={15} />
          </button>
        );
      })}
    </div>
  );
}

async function invitePeople() {
  const shareData = {
    title: "Ọru",
    text: "Meet Ọru — your delightfully capable agent desk.",
    url: window.location.origin,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    showToast("Invite link copied ✨");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    showToast("Couldn’t share that link. Try again.");
  }
}

export function SidebarFooter() {
  const supportAvailable = useSupportAvailable();
  const { settingsOpen, openSettings } = useView();

  return (
    <div className="flex flex-col gap-1">
      <SidebarHoverGroup>
        <nav aria-label="Help and account links" className="flex flex-col gap-0">
          <SidebarRow
            icon={IconGiftFilled}
            label="Invite friends"
            onClick={() => void invitePeople()}
          />
          <SidebarRow
            icon={IconHelpCircleFilled}
            label="Help & support"
            onClick={() => {
              if (supportAvailable) openSupport();
              else showToast("Support isn’t available in this deployment yet.");
            }}
          />
          <SidebarRow
            icon={IconSettingsFilled}
            label="Settings"
            active={settingsOpen}
            onClick={() => openSettings()}
          />
        </nav>
      </SidebarHoverGroup>
      <SidebarThemeSwitch />
    </div>
  );
}
