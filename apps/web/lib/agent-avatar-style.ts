"use client";

import { useSyncExternalStore } from "react";

export type AgentAvatarStyle =
  | "voxel-bot"
  | "thumbs"
  | "critters"
  | "clay"
  | "gaze"
  | "moods";

export const DEFAULT_AGENT_AVATAR_STYLE: AgentAvatarStyle = "clay";

export const AGENT_AVATAR_STYLES: ReadonlyArray<{
  value: AgentAvatarStyle;
  label: string;
}> = [
  { value: "voxel-bot", label: "Voxel Bot" },
  { value: "thumbs", label: "Thumbs" },
  { value: "critters", label: "Critters" },
  { value: "clay", label: "Clay" },
  { value: "gaze", label: "Gaze" },
  { value: "moods", label: "Moods" },
];

const STORAGE_KEY = "oru-agent-avatar-style";
const CHANGE_EVENT = "oru:agent-avatar-style";
const VALUES = new Set(AGENT_AVATAR_STYLES.map(({ value }) => value));

let cached: AgentAvatarStyle | null = null;

function read(): AgentAvatarStyle {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALUES.has(stored as AgentAvatarStyle)
      ? (stored as AgentAvatarStyle)
      : DEFAULT_AGENT_AVATAR_STYLE;
  } catch {
    return DEFAULT_AGENT_AVATAR_STYLE;
  }
}

function snapshot() {
  if (cached === null) cached = read();
  return cached;
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cached = read();
    onChange();
  };

  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAgentAvatarStyle() {
  const style = useSyncExternalStore(
    subscribe,
    snapshot,
    () => DEFAULT_AGENT_AVATAR_STYLE,
  );

  const setStyle = (next: AgentAvatarStyle) => {
    cached = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The in-memory preference still works for this visit.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return { style, setStyle };
}
