"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@whirl/backend/convex/_generated/api";
import type { Id } from "@whirl/backend/convex/_generated/dataModel";
import { IconEdit, IconPlayerPauseFilled, IconPlayerPlayFilled, IconRefresh, IconTrash } from "@tabler/icons-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Task = {
  id: Id<"deskTasks">;
  title: string;
  instructions?: string;
  status?: string;
  recurrence?: string;
  nextRunAt?: number;
  timeZone?: string;
};

function localDateTime(value?: number) {
  const date = new Date(value ?? Date.now() + 60 * 60 * 1_000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function TaskActions({ task }: { task: Task }) {
  const pause = useMutation(api.scheduledTasks.pause);
  const resume = useMutation(api.scheduledTasks.resume);
  const runNow = useMutation(api.scheduledTasks.runNow);
  const update = useMutation(api.scheduledTasks.update);
  const remove = useMutation(api.scheduledTasks.remove);
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [instructions, setInstructions] = useState(task.instructions ?? "");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">(task.recurrence === "daily" || task.recurrence === "weekly" ? task.recurrence : "none");
  const [runAt, setRunAt] = useState(localDateTime(task.nextRunAt));
  const [error, setError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const iconButton = "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function perform(action: () => Promise<unknown>) {
    setActionError(undefined);
    try {
      await action();
      return true;
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "The task could not be changed.");
      return false;
    }
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      await update({ taskId: task.id, title, instructions, recurrence, nextRunAt: new Date(runAt).getTime(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The task could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-end gap-0.5">
        {task.status === "paused" ? (
          <button className={iconButton} type="button" title="Resume" aria-label={`Resume ${task.title}`} onClick={() => void perform(() => resume({ taskId: task.id }))}><IconPlayerPlayFilled size={14} aria-hidden="true" /></button>
        ) : task.status !== "completed" ? (
          <button className={iconButton} type="button" title="Pause" aria-label={`Pause ${task.title}`} onClick={() => void perform(() => pause({ taskId: task.id }))}><IconPlayerPauseFilled size={14} aria-hidden="true" /></button>
        ) : null}
        <button className={iconButton} type="button" title="Run now" aria-label={`Run ${task.title} now`} onClick={() => void perform(() => runNow({ taskId: task.id }))}><IconRefresh size={15} aria-hidden="true" /></button>
        <button className={iconButton} type="button" title="Edit" aria-label={`Edit ${task.title}`} onClick={() => setEditing(true)}><IconEdit size={15} aria-hidden="true" /></button>
        <button className={iconButton} type="button" title="Remove" aria-label={`Remove ${task.title}`} onClick={() => setConfirmingRemove(true)}><IconTrash size={15} aria-hidden="true" /></button>
        </div>
        {actionError && <p role="alert" className="mt-1 max-w-44 text-right text-[10.5px] text-destructive">{actionError}</p>}
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit task</DialogTitle><DialogDescription>Change what the agent does and when it runs.</DialogDescription></DialogHeader>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-[12px] font-medium">Title<Input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="grid gap-1.5 text-[12px] font-medium">Instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={5} className="resize-y rounded-lg border border-border bg-background px-3 py-2 text-[13px]/5 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-[12px] font-medium">Next run<Input type="datetime-local" value={runAt} onChange={(event) => setRunAt(event.target.value)} /></label>
              <label className="grid gap-1.5 text-[12px] font-medium">Repeats<select value={recurrence} onChange={(event) => setRecurrence(event.target.value as typeof recurrence)} className="h-9 rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
            </div>
            {error && <p role="alert" className="text-[12px] text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose className="rounded-lg bg-accent px-3 py-1.5 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</DialogClose>
            <button type="button" disabled={saving} onClick={() => void save()} className="rounded-lg bg-primary px-3 py-1.5 text-[12px] text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmingRemove} onOpenChange={setConfirmingRemove}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove this task?</DialogTitle><DialogDescription>{task.title} will stop running and disappear from the Tasks page.</DialogDescription></DialogHeader>
          <DialogFooter>
            <DialogClose className="rounded-lg bg-accent px-3 py-1.5 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Keep task</DialogClose>
            <button type="button" onClick={() => void perform(() => remove({ taskId: task.id })).then((removed) => { if (removed) setConfirmingRemove(false); })} className="rounded-lg bg-destructive px-3 py-1.5 text-[12px] text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Remove task</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
