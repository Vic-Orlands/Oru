import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { DEFAULT_LEAD_AGENT } from "./leadAgents";
import { appendUserTurn } from "./turns";

const DAY_MS = 24 * 60 * 60 * 1_000;
const WEEK_MS = 7 * DAY_MS;

function followingRun(
  scheduledFor: number,
  recurrence: "none" | "daily" | "weekly",
  now: number,
) {
  if (recurrence === "none") return undefined;
  const interval = recurrence === "daily" ? DAY_MS : WEEK_MS;
  let next = scheduledFor + interval;
  while (next <= now) next += interval;
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
    const nextRunAt = followingRun(scheduledFor, recurrence, now);
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
