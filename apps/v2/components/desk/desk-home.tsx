"use client";

import { useEffect, useState } from "react";
import {
  IconArrowUp,
  IconCheckbox,
  IconChevronDown,
  IconMail,
  IconSparkles,
} from "@tabler/icons-react";

import { useDeskData } from "@/lib/desk-data";
import { CHAT_MODELS } from "@/lib/models";
import { useView } from "@/lib/view";

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
  onSubmit,
}: {
  model: string;
  onSubmit: (text: string) => void;
}) {
  const { openDesk } = useView();
  const desk = useDeskData();
  const [tab, setTab] = useState<"new" | "running">("new");
  const [text, setText] = useState("");
  const [widgets, setWidgets] = useState<Set<WidgetId>>(() => new Set(WIDGETS));
  const [menu, setMenu] = useState(false);
  const modelName = CHAT_MODELS.find((item) => item.key === model)?.name ?? "Kimi";

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

  const send = () => {
    const value = text.trim();
    if (!value) return;
    onSubmit(value);
    setText("");
  };

  const peak = Math.max(...desk.bars, 1);

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="relative h-[248px] overflow-hidden md:h-[292px]">
        <img
          src="/brand/hero-loft.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/55" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background" />
        <h1 className="absolute inset-x-4 bottom-[6.25rem] text-center text-[22px] font-medium tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)] md:text-[26px]">
          Who should we reach today?
        </h1>
      </div>

      <div className="relative z-10 -mt-16 px-4 pb-10 md:px-8">
        <div className="mx-auto w-full max-w-[680px] overflow-hidden rounded-2xl bg-card shadow-[0_16px_40px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/10 dark:ring-white/12">
          <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
            <TabButton active={tab === "new"} onClick={() => setTab("new")}>
              New chat
            </TabButton>
            <TabButton active={tab === "running"} onClick={() => setTab("running")}>
              Running agents
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[10px] leading-none text-primary-foreground tabular-nums">
                1
              </span>
            </TabButton>
          </div>
          {tab === "new" ? (
            <>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={3}
                placeholder="Describe who you want, or a list to write to…"
                className="w-full resize-none bg-transparent px-3.5 py-3 text-[13.5px]/5 outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-2 px-2.5 pb-2.5">
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  <Chip>Workspace · Oso</Chip>
                  <Chip>
                    <IconSparkles size={12} />
                    {modelName}
                  </Chip>
                  <Chip>Gmail · Calendar</Chip>
                </div>
                <button
                  type="button"
                  onClick={send}
                  aria-label="Send"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <IconArrowUp size={16} />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openDesk("tasks")}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-accent/60"
            >
              <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">
                  Clinic groups that still book by hand
                </span>
                <span className="text-[12px] text-muted-foreground">Qualifying · 20s</span>
              </span>
            </button>
          )}
        </div>

        <div className="mx-auto mt-5 w-full max-w-[920px]">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {widgets.has("working") && (
              <Widget title="Working now" meta="1" className="sm:col-span-1">
                <button
                  type="button"
                  onClick={() => openDesk("tasks")}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>
                    <span className="block text-[13px] font-medium">Tune the clinic search</span>
                    <span className="text-[11.5px] text-muted-foreground">2m 13s · kimi</span>
                  </span>
                </button>
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
              <Widget title="Pipeline" meta="4 meetings">
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
              <Widget title="Campaign" meta="7 days">
                <div className="flex h-[4.5rem] items-end gap-1.5">
                  {desk.bars.map((value, index) => (
                    <div
                      key={`${DAYS[index]}-${index}`}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    >
                      <div
                        className="w-full rounded-[3px] bg-primary/85"
                        style={{
                          height: `${Math.max(4, Math.round((value / peak) * 40))}px`,
                        }}
                      />
                      <span className="text-[10px] leading-none text-muted-foreground">
                        {DAYS[index]}
                      </span>
                    </div>
                  ))}
                </div>
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
              <Widget title="Replies">
                <button
                  type="button"
                  onClick={() => openDesk("approvals")}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <IconMail size={14} className="mt-0.5 text-muted-foreground" />
                  <span>
                    <span className="block text-[12.5px] font-medium">Elena Voss · Fieldnote</span>
                    <span className="text-[11.5px] text-muted-foreground">
                      Asked for Thursday. Draft a reply?
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[11.5px] text-muted-foreground">
      {children}
    </span>
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
    <section className={`rounded-xl bg-card p-3 ring-1 ring-border ${className}`}>
      <header className="mb-2 flex items-center justify-between text-[11.5px] font-medium text-muted-foreground">
        <span>{title}</span>
        {meta && <span className="tabular-nums">{meta}</span>}
      </header>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}
