"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconArrowUp,
  IconCheckbox,
  IconChevronDown,
  IconMail,
  IconPaperclip,
} from "@tabler/icons-react";
import { useConvexAuth } from "convex/react";

import { useDeskData } from "@/lib/desk-data";
import type { AttachmentUpload } from "@/lib/attachments";
import { attachmentRejectionReason } from "@/lib/attachments";
import { useAttachments } from "@/lib/use-attachments";
import { useComposerModels } from "@/lib/model-catalog";
import { useModelAccess } from "@/lib/model-access";
import type { SetModelPref } from "@/lib/model-pref";
import { useSearchPref, useThinkingPref, type ComposerGates } from "@/lib/composer-gates";
import { useRunningThreadIds, useThreads } from "@/lib/threads";
import { useView } from "@/lib/view";
import { AgentSwitcher } from "@/components/agent-switcher";
import { leadAgentById, useLeadAgent } from "@/lib/lead-agents";
import { ComposerAttachments } from "@/components/composer-attachments";
import { ModelSelect } from "@/components/model-select";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const WIDGETS = [
  "working",
  "approvals",
  "pipeline",
  "campaign",
  "tasks",
  "lists",
  "replies",
] as const;

type WidgetId = (typeof WIDGETS)[number];

const WIDGET_LABEL: Record<WidgetId, string> = {
  working: "Working now",
  approvals: "Approvals waiting",
  pipeline: "Pipeline",
  campaign: "Campaign",
  tasks: "Today’s tasks",
  lists: "Prospect lists",
  replies: "Replies",
};

function loadWidgets(): Set<WidgetId> {
  try {
    const raw = localStorage.getItem("oso-widgets");
    if (!raw) return new Set(WIDGETS);
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set(WIDGETS);
    const next = parsed.filter((id): id is WidgetId =>
      (WIDGETS as readonly string[]).includes(id),
    );
    return new Set(next.length > 0 ? next : WIDGETS);
  } catch {
    return new Set(WIDGETS);
  }
}

export function DeskHome({
  model,
  onModelChange,
  onSubmit,
}: {
  model: string;
  onModelChange: SetModelPref;
  onSubmit: (text: string, model: string, attachments: AttachmentUpload[], gates: ComposerGates) => Promise<void>;
}) {
  const { isAuthenticated } = useConvexAuth();
  const leadAgentId = useLeadAgent();
  const leadAgent = leadAgentById(leadAgentId);
  const { openDesk, openThread } = useView();
  const desk = useDeskData();
  const threads = useThreads(isAuthenticated) ?? [];
  const runningThreadIds = useRunningThreadIds(isAuthenticated);
  const runningThreads = threads.filter((thread) =>
    runningThreadIds.has(thread.id),
  );
  const [tab, setTab] = useState<"new" | "running">("new");
  const [text, setText] = useState("");
  const [widgets, setWidgets] = useState<Set<WidgetId>>(() => new Set(WIDGETS));
  const [menu, setMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachments = useAttachments();
  const models = useComposerModels();
  const { isPaid } = useModelAccess();
  const [searchOn, setSearchOn] = useSearchPref();
  const [thinking, setThinking] = useThinkingPref();
  const currentModel = models.find((item) => item.key === model) ?? models[0];
  const rejectionFor = (file: { name: string; size: number; type: string }) =>
    currentModel ? attachmentRejectionReason(file, currentModel, isPaid === false) : "Models are still loading.";
  const hasInvalidFiles = attachments.drafts.some((draft) => draft.status === "error" || rejectionFor(draft) !== null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidgets(loadWidgets()));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = (id: WidgetId) => {
    setWidgets((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("oso-widgets", JSON.stringify([...next]));
      } catch {
        /* private mode */
      }
      return next;
    });
  };

  const send = async () => {
    const value = text.trim();
    if ((!value && attachments.drafts.length === 0) || hasInvalidFiles || sending) return;
    setSending(true);
    try {
      const files = await attachments.resolve();
      await onSubmit(value, model, files, { search: searchOn, thinking });
      setText("");
      attachments.clear();
    } finally {
      setSending(false);
    }
  };

  const peak = Math.max(...desk.bars, 1);
  const meetingCount =
    desk.pipeline.find((stage) =>
      stage.stage.toLowerCase().includes("meeting"),
    )?.count ?? 0;
  const replyCount = desk.campaigns.reduce(
    (total, campaign) => total + campaign.replies,
    0,
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto xl:overflow-hidden">
      <div className="relative h-[200px] shrink-0 overflow-hidden md:h-[228px]">
        <img
          src="/brand/hero-loft.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/55" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background" />
        <h1 className="absolute inset-x-4 bottom-[5.75rem] text-center text-[22px] font-medium tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)] md:text-[26px]">
          {leadAgentId === "job_hunt"
            ? "Which opportunity should we chase?"
            : leadAgentId === "recruiting"
              ? "Who should join the team?"
              : leadAgentId === "partnerships"
                ? "Who should we build with?"
                : leadAgentId === "fundraising"
                  ? "Who should hear the story?"
                  : "Who should we reach today?"}
        </h1>
        <div className="absolute top-3 right-3 rounded-xl bg-black/35 text-white backdrop-blur-md md:hidden">
          <AgentSwitcher compact />
        </div>
      </div>

      <div className="relative z-10 -mt-10 flex min-h-0 flex-1 flex-col px-4 pb-4 md:px-8">
        <div className="mx-auto w-full max-w-[680px] overflow-hidden rounded-2xl bg-card shadow-[0_16px_40px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/10 dark:ring-white/12">
          <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
            <TabButton active={tab === "new"} onClick={() => setTab("new")}>
              New chat
            </TabButton>
            <TabButton active={tab === "running"} onClick={() => setTab("running")}>
              Running agents
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] leading-none text-primary-foreground tabular-nums">
                {runningThreads.length}
              </span>
            </TabButton>
          </div>
          {tab === "new" ? (
            <>
              {attachments.drafts.length > 0 && (
                <ComposerAttachments drafts={attachments.drafts} rejectionFor={rejectionFor} onRemove={attachments.remove} />
              )}
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={3}
                placeholder={`Describe the ${leadAgent.noun} you want to find…`}
                className="w-full resize-none bg-transparent px-3.5 py-3 text-[13.5px]/5 outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-2 px-2.5 pb-2.5">
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  <div className="rounded-md bg-accent"><AgentSwitcher compact /></div>
                  <div className="rounded-md bg-accent">
                    <ModelSelect value={model} onValueChange={onModelChange} searchOn={searchOn} onSearchOnChange={setSearchOn} thinking={thinking} onThinkingChange={setThinking} />
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-2.5 text-[12.5px]/4 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Attach files">
                    <IconPaperclip size={13} aria-hidden="true" />Attach
                  </button>
                  <input ref={fileInputRef} type="file" multiple hidden onChange={(event) => { if (event.target.files?.length) attachments.addFiles(event.target.files); event.target.value = ""; }} />
                </div>
                <button
                  type="button"
                  onClick={() => void send()}
                  aria-label="Send"
                  disabled={sending || hasInvalidFiles || (text.trim().length === 0 && attachments.drafts.length === 0)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                >
                  <IconArrowUp size={16} />
                </button>
              </div>
            </>
          ) : runningThreads.length > 0 ? (
            <div className="divide-y divide-border">
              {runningThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => openThread(thread.id)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-accent/60"
                >
                  <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {thread.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3.5 py-4 text-[12.5px] text-muted-foreground">
              No agents are running right now.
            </p>
          )}
        </div>

        <div className="mx-auto mt-4 flex w-full min-h-0 max-w-[1080px] flex-1 flex-col">
          <div className="mb-2 flex justify-end">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu((open) => !open)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Customize
                <IconChevronDown size={12} />
              </button>
              {menu && (
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl bg-popover p-1.5 text-[12.5px] shadow-lg ring-1 ring-border">
                  {WIDGETS.map((id) => (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={widgets.has(id)}
                        onChange={() => toggle(id)}
                        className="accent-current"
                      />
                      {WIDGET_LABEL[id]}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:grid-rows-2 xl:content-stretch">
            {widgets.has("working") && (
              <Widget
                title="Working now"
                meta={String(runningThreads.length)}
                className="sm:col-span-1"
              >
                {runningThreads.length > 0 ? (
                  runningThreads.slice(0, 3).map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => openThread(thread.id)}
                      className="flex w-full items-start gap-2 text-left"
                    >
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="min-w-0 truncate text-[13px] font-medium">
                        {thread.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-[12px] text-muted-foreground">No active work.</p>
                )}
              </Widget>
            )}
            {widgets.has("approvals") && (
              <Widget title="Approvals waiting" meta={String(desk.approvals.length)}>
                {desk.approvals.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openDesk("approvals")}
                    className="block w-full truncate text-left text-[12.5px] hover:underline"
                  >
                    {item.to} · {item.subject}
                  </button>
                ))}
              </Widget>
            )}
            {widgets.has("pipeline") && (
              <Widget title="Pipeline" meta={`${meetingCount} meetings`}>
                {desk.pipeline.slice(0, 4).map((stage) => (
                  <div key={stage.stage} className="flex items-baseline gap-2 text-[12px]">
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {stage.stage}
                    </span>
                    <span className="shrink-0 tabular-nums">{stage.count}</span>
                    <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                      {stage.rate}
                    </span>
                  </div>
                ))}
              </Widget>
            )}
            {widgets.has("campaign") && (
              <Widget title="Campaign" meta={String(desk.campaigns.length)}>
                {desk.bars.length > 0 ? (
                  <div className="flex h-20 items-end gap-1.5">
                    {desk.bars.map((value, index) => (
                      <div
                        key={`${DAYS[index]}-${index}`}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                      >
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-[3px] bg-primary/85"
                            style={{
                              height: `${Math.max(18, Math.round((value / peak) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] leading-none text-muted-foreground">
                          {DAYS[index]}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-muted-foreground">
                    No campaign activity yet.
                  </p>
                )}
              </Widget>
            )}
            {widgets.has("tasks") && (
              <Widget title="Today’s tasks" meta={String(desk.tasks.length)} className="sm:col-span-2">
                {desk.tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => openDesk("tasks")}
                    className="flex w-full items-center gap-2 text-left text-[12.5px]"
                  >
                    <IconCheckbox size={14} className="text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{task.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{task.when}</span>
                  </button>
                ))}
              </Widget>
            )}
            {widgets.has("lists") && (
              <Widget title="Recent lists">
                {desk.lists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => openDesk("prospects")}
                    className="flex w-full items-center justify-between text-left text-[12.5px]"
                  >
                    <span className="truncate">{list.name}</span>
                    <span className="ml-2 tabular-nums text-muted-foreground">{list.count}</span>
                  </button>
                ))}
              </Widget>
            )}
            {widgets.has("replies") && (
              <Widget title="Replies" meta={String(replyCount)}>
                <button
                  type="button"
                  onClick={() => openDesk("campaigns")}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <IconMail size={14} className="mt-0.5 text-muted-foreground" />
                  <span>
                    <span className="block text-[12.5px] font-medium">
                      {replyCount > 0 ? `${replyCount} campaign replies` : "No replies yet"}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      Open campaign activity
                    </span>
                  </span>
                </button>
              </Widget>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[12.5px] ${
        active ? "bg-accent font-medium text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Widget({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex h-full min-h-0 flex-col rounded-xl bg-card p-3.5 ring-1 ring-border ${className}`}>
      <header className="mb-2 flex items-center justify-between text-[11.5px] font-medium text-muted-foreground">
        <span>{title}</span>
        {meta && <span className="tabular-nums">{meta}</span>}
      </header>
      <div className="flex min-h-0 flex-1 flex-col justify-start gap-2">{children}</div>
    </section>
  );
}
