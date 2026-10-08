"use client";

import { useMutation } from "convex/react";
import { api } from "@whirl/backend/convex/_generated/api";
import type { Id } from "@whirl/backend/convex/_generated/dataModel";
import { IconPlayerPauseFilled, IconPlayerPlayFilled, IconRefresh } from "@tabler/icons-react";

export function TaskActions({ taskId, status }: { taskId: Id<"deskTasks">; status?: string }) {
  const pause = useMutation(api.scheduledTasks.pause);
  const resume = useMutation(api.scheduledTasks.resume);
  const runNow = useMutation(api.scheduledTasks.runNow);
  const button = "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="flex items-center gap-1">
      {status === "paused" ? (
        <button className={button} type="button" title="Resume" aria-label="Resume scheduled task" onClick={() => void resume({ taskId })}><IconPlayerPlayFilled size={14} /></button>
      ) : (
        <button className={button} type="button" title="Pause" aria-label="Pause scheduled task" onClick={() => void pause({ taskId })}><IconPlayerPauseFilled size={14} /></button>
      )}
      <button className={button} type="button" title="Run now" aria-label="Run scheduled task now" onClick={() => void runNow({ taskId })}><IconRefresh size={15} /></button>
    </div>
  );
}
