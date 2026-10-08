import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { DEFAULT_LEAD_AGENT } from "./leadAgents";
import { appendUserTurn } from "./turns";

const DAY_MS = 24 * 60 * 60 * 1_000;
const WEEK_MS = 7 * DAY_MS;

export function followingRun(
  scheduledFor: number,
  recurrence: "none" | "daily" | "weekly",
  now: number,
  timeZone = "UTC",
) {
  if (recurrence === "none") return undefined;
  const intervalDays = recurrence === "daily" ? 1 : 7;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(scheduledFor).map((part) => [part.type, part.value]));
  const desired = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + intervalDays, Number(parts.hour), Number(parts.minute), Number(parts.second)));
  let next = desired.getTime();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actualParts = Object.fromEntries(formatter.formatToParts(next).map((part) => [part.type, part.value]));
    const actual = Date.UTC(Number(actualParts.year), Number(actualParts.month) - 1, Number(actualParts.day), Number(actualParts.hour), Number(actualParts.minute), Number(actualParts.second));
    next += desired.getTime() - actual;
  }
  while (next <= now) next += recurrence === "daily" ? DAY_MS : WEEK_MS;
  return next;
}

export const run = internalMutation({
  args: { taskId: v.id("deskTasks") },
  returns: v.null(),
  handler: async (ctx, { taskId }) => {
    const task = await ctx.db.get(taskId);
    const now = Date.now();
    if (
      !task ||
      task.status !== "active" ||
      task.nextRunAt === undefined ||
      task.nextRunAt > now + 5_000 ||
      !task.instructions
    ) {
      return null;
    }

    const leadAgent = task.leadAgent ?? DEFAULT_LEAD_AGENT;
    const scheduledFor = task.nextRunAt;
    const threadId = await ctx.db.insert("threads", {
      userId: task.userId,
      leadAgent,
      title: task.title,
      titleStatus: "ready",
      createdAt: now,
      updatedAt: now,
      model: "Auto",
      scheduledTaskId: taskId,
    });

    await appendUserTurn(ctx, {
      threadId,
      userId: task.userId,
      content: `Scheduled task: ${task.title}\n\n${task.instructions}`,
      attachments: undefined,
      mentions: undefined,
      skillMentions: undefined,
      options: {
        thinking: false,
        search: true,
        model: "Auto",
        leadAgent,
      },
      model: "Auto",
      userName: undefined,
      now,
    });

    const recurrence = task.recurrence ?? "none";
    const nextRunAt = followingRun(scheduledFor, recurrence, now, task.timeZone);
    await ctx.db.patch(taskId, {
      lastRunAt: now,
      lastThreadId: threadId,
      updatedAt: now,
      status: nextRunAt === undefined ? "completed" : "active",
      done: nextRunAt === undefined,
      nextRunAt,
    });

    if (nextRunAt !== undefined) {
      await ctx.scheduler.runAt(nextRunAt, internal.scheduledTasks.run, {
        taskId,
      });
    }
    return null;
  },
});

async function ownedTask(ctx: MutationCtx, taskId: Id<"deskTasks">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to manage scheduled tasks.");
  const task = await ctx.db.get(taskId);
  if (!task || task.userId !== identity.subject) throw new Error("Scheduled task not found.");
  return task;
}

export const pause = mutation({
  args: { taskId: v.id("deskTasks") },
  handler: async (ctx, { taskId }) => {
    await ownedTask(ctx, taskId);
    await ctx.db.patch(taskId, { status: "paused", updatedAt: Date.now() });
    return null;
  },
});

export const resume = mutation({
  args: { taskId: v.id("deskTasks") },
  handler: async (ctx, { taskId }) => {
    const task = await ownedTask(ctx, taskId);
    const nextRunAt = Math.max(Date.now() + 1_000, task.nextRunAt ?? Date.now() + 1_000);
    await ctx.db.patch(taskId, { status: "active", done: false, nextRunAt, updatedAt: Date.now(), lastError: undefined });
    await ctx.scheduler.runAt(nextRunAt, internal.scheduledTasks.run, { taskId });
    return null;
  },
});

export const runNow = mutation({
  args: { taskId: v.id("deskTasks") },
  handler: async (ctx, { taskId }) => {
    await ownedTask(ctx, taskId);
    const nextRunAt = Date.now();
    await ctx.db.patch(taskId, { status: "active", done: false, nextRunAt, updatedAt: nextRunAt, lastError: undefined });
    await ctx.scheduler.runAfter(0, internal.scheduledTasks.run, { taskId });
    return null;
  },
});

export const recoverDue = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const due = await ctx.db
      .query("deskTasks")
      .withIndex("by_status_next_run", (q) =>
        q.eq("status", "active").lte("nextRunAt", Date.now()),
      )
      .take(25);

    for (const task of due) {
      await ctx.scheduler.runAfter(0, internal.scheduledTasks.run, {
        taskId: task._id,
      });
    }
    return null;
  },
});
