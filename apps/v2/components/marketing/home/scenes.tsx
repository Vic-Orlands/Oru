"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export type SceneId = "find" | "judge" | "write" | "approve" | "track";

const ROOMS = [
  {
    id: "clinics",
    label: "Lagos clinics",
    hint: "Groups that still book by hand",
    rows: [
      ["Amaka Adeyemi", "Halcyon", "Lagos · 11 sites", "11-day wait", "92"],
      ["Ifeanyi Obi", "Cedar Ward", "Ikeja · 4 sites", "Paper roster", "88"],
      ["Ngozi Bassey", "Lumen Health", "VI · 7 sites", "No online book", "84"],
      ["Tunde Salami", "Northbridge", "Lekki · 3 sites", "Shared inbox", "79"],
      ["Chioma Eze", "Field & Co", "Yaba · 6 sites", "Walk-in heavy", "76"],
      ["Bola Adeniyi", "Harbor Clinic", "Ajah · 5 sites", "Phone-only", "74"],
      ["Seyi Lawal", "Kindred", "Ikeja · 8 sites", "No reminders", "71"],
    ],
  },
  {
    id: "fintech",
    label: "Series A fintech",
    hint: "Teams still sending from a founder inbox",
    rows: [
      ["Jonah Ellis", "Fieldnote", "Austin · 40", "Founder sends", "86"],
      ["Priya Raman", "Northspan", "London · 22", "No sequencer", "83"],
      ["Elena Voss", "Ledgerly", "Berlin · 18", "Manual CRM", "80"],
      ["Marcus Hale", "Kite Pay", "NYC · 31", "Stale pipeline", "77"],
      ["Sofia Mendes", "Arcadia", "Lisbon · 14", "One AE", "74"],
    ],
  },
  {
    id: "field",
    label: "Field service",
    hint: "Dispatchers still on a shared inbox",
    rows: [
      ["Ruth Adewale", "Route & Co", "Abuja · 60 techs", "Radio dispatch", "90"],
      ["Ben Carter", "Northline", "Denver · 44", "Whiteboard", "85"],
      ["Hana Ito", "Sable Ops", "Osaka · 28", "After-hours", "81"],
      ["Owen Clarke", "Milemark", "Chicago · 35", "Missed windows", "78"],
      ["Lara Njoku", "Kiln Field", "PH · 19", "Paper jobs", "73"],
    ],
  },
] as const;

const VERDICTS = [
  ["Amaka Adeyemi", "Halcyon", "yes", "Public waitlist. Booking is still a spreadsheet.", "92"],
  ["Jonah Ellis", "Fieldnote", "yes", "Founder still sends. No sequencer on the domain.", "86"],
  ["Priya Raman", "Northspan", "no", "Already on a sequencer. Duplicate of an open thread.", "41"],
  ["Ifeanyi Obi", "Cedar Ward", "yes", "Four sites, one front desk, no online book.", "88"],
  ["Elena Voss", "Ledgerly", "no", "Hiring an AE this month. Wrong week to write.", "38"],
] as const;

const SEQUENCE = [
  ["Day 0", "A quieter Thursday", "Amaka — Ikeja still shows an eleven-day wait. We book the first consult before the spreadsheet opens."],
  ["Day 3", "The number, if it’s useful", "Three clinics published the same wait. Happy to leave it if the desk is already full."],
  ["Day 7", "A short note, not a pitch", "I’ll close this out. If Thursday opens up, the note is one line."],
] as const;

const QUEUE = [
  ["Halcyon Clinics", "A quieter Thursday", "Amaka — Ikeja still shows an eleven-day wait."],
  ["Fieldnote", "Founder inbox", "Jonah — the last three notes went out from you."],
  ["Route & Co", "Dispatch window", "Ruth — Saturday jobs are still on the radio."],
] as const;

const REPLIES = [
  ["Amaka Adeyemi", "Replied", "Tue · 09:14", "Send Thursday’s note."],
  ["Jonah Ellis", "Meeting", "Thu · 09:30", "Calendar hold, 25 min."],
  ["Ruth Adewale", "Replied", "Wed · 16:02", "Ask for the dispatcher."],
  ["Ifeanyi Obi", "Silent", "Day 3", "Hold the follow-up."],
] as const;

function Frame({
  kicker,
  title,
  aside,
  children,
  tall = false,
}: {
  kicker: string;
  title: string;
  aside?: string;
  children: ReactNode;
  tall?: boolean;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl bg-card text-foreground shadow-[0_30px_80px_-40px_rgba(40,24,10,0.55)] ring-1 ring-border ${
        tall ? "min-h-[560px] lg:min-h-[680px]" : "min-h-[440px]"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            {kicker}
          </div>
          <div className="truncate text-[14px] font-medium">{title}</div>
        </div>
        {aside ? <div className="shrink-0 text-[12px] text-muted-foreground">{aside}</div> : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3 md:p-4">{children}</div>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
      {children}
    </span>
  );
}

export function HeroDesk() {
  const reduce = useReducedMotion();
  const [room, setRoom] = useState(0);
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const seen = useRef(false);

  useEffect(() => {
    seen.current = true;
  }, []);

  const current = ROOMS[room] ?? ROOMS[0];
  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setShift({ x, y });
  };

  return (
    <div className="relative" onPointerMove={onMove} onPointerLeave={() => setShift({ x: 0, y: 0 })}>
      <div
        className="relative z-10"
        style={{
          transform: reduce ? undefined : `translate3d(${shift.x * 10}px, ${shift.y * 8}px, 0)`,
        }}
      >
        <Frame kicker="Room" title={current.hint} aside="5 strong fits" tall>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {ROOMS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRoom(index)}
                className={`rounded-full px-2.5 py-1 text-[12px] ring-1 transition-colors ${
                  room === index
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-background text-muted-foreground ring-border hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl ring-1 ring-border">
            <div className="grid grid-cols-[1.3fr_0.9fr_0.7fr] gap-2 bg-background px-3 py-2 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              <span>Name</span>
              <span className="hidden sm:block">Signal</span>
              <span className="text-right">Fit</span>
            </div>
            <AnimatePresence mode="popLayout" initial={false}>
              {current.rows.slice(0, 5).map((row, index) => (
                <motion.div
                  key={`${current.id}-${row[0]}`}
                  layout
                  initial={seen.current && !reduce ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, delay: seen.current ? index * 0.035 : 0 }}
                  className="grid grid-cols-[1.3fr_0.9fr_0.7fr] items-center gap-2 border-t border-border px-3 py-2.5 text-[12.5px]"
                >
                  <span className="min-w-0 truncate">
                    {row[0]}
                    <span className="ml-1.5 text-muted-foreground">{row[1]}</span>
                  </span>
                  <span className="hidden min-w-0 truncate sm:block">
                    <Chip>{row[3]}</Chip>
                  </span>
                  <span className="text-right font-medium tabular-nums">{row[4]}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Frame>
      </div>
      <div
        className="absolute -top-3 right-3 z-20 hidden w-44 rounded-2xl bg-card p-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)] ring-1 ring-border sm:block md:-right-6"
        style={{
          transform: reduce ? undefined : `translate3d(${shift.x * -18}px, ${shift.y * -14}px, 0)`,
        }}
      >
        <div className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Judge</div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-[22px] font-medium tabular-nums">{current.rows[0]?.[4]}</span>
          <Chip>Yes</Chip>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{current.rows[0]?.[3]}</p>
      </div>
      <div
        className="absolute -bottom-3 left-3 z-20 hidden items-center gap-2 rounded-2xl bg-card px-3 py-2.5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)] ring-1 ring-border sm:flex md:-left-8"
        style={{
          transform: reduce ? undefined : `translate3d(${shift.x * -12}px, ${shift.y * 16}px, 0)`,
        }}
      >
        <IconCircleCheckFilled size={16} className="text-primary" />
        <div>
          <div className="text-[12px] font-medium">Held for you</div>
          <div className="text-[11px] text-muted-foreground">Nothing has been sent</div>
        </div>
      </div>
    </div>
  );
}

export function DeskScene({ id }: { id: SceneId }) {
  if (id === "judge") return <JudgeScene />;
  if (id === "write") return <WriteScene />;
  if (id === "approve") return <ApproveScene />;
  if (id === "track") return <TrackScene />;
  return <FindScene />;
}

function FindScene() {
  const rows = ROOMS[0].rows;
  return (
    <Frame kicker="Find" title="Clinic groups, enriched" aside="48 named · 5 shown" tall>
      <div className="overflow-hidden rounded-xl ring-1 ring-border">
        <div className="grid grid-cols-[1.2fr_1fr_auto] gap-2 bg-background px-3 py-2 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          <span>Person</span>
          <span>Enrichment</span>
          <span>Fit</span>
        </div>
        {rows.map((row) => (
          <div
            key={row[0]}
            className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-2 border-t border-border px-3 py-3 text-[12.5px]"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{row[0]}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{row[1]} · {row[2]}</span>
            </span>
            <span className="flex min-w-0 flex-wrap gap-1">
              <Chip>{row[3]}</Chip>
              <span className="hidden rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border lg:inline">
                {row[2].split("·")[0]?.trim()}
              </span>
            </span>
            <span className="font-medium tabular-nums">{row[4]}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function JudgeScene() {
  return (
    <Frame kicker="Judge" title="Yes, or it never becomes a draft" aside="3 yes · 2 no" tall>
      <ul className="flex flex-1 flex-col gap-2">
        {VERDICTS.map(([name, co, verdict, reason, score]) => {
          const yes = verdict === "yes";
          return (
            <li key={name} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl bg-background px-3 py-2.5 ring-1 ring-border">
              {yes ? (
                <IconCircleCheckFilled size={16} className="mt-0.5 text-primary" />
              ) : (
                <IconCircleXFilled size={16} className="mt-0.5 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <div className="text-[13px] font-medium">
                  {name}
                  <span className="ml-1.5 font-normal text-muted-foreground">{co}</span>
                </div>
                <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground">{reason}</p>
              </div>
              <div className="text-right">
                <div className={`text-[11px] font-medium tracking-[0.12em] uppercase ${yes ? "text-primary" : "text-muted-foreground"}`}>
                  {yes ? "Yes" : "No"}
                </div>
                <div className="text-[12px] tabular-nums text-muted-foreground">{score}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

function WriteScene() {
  const reduce = useReducedMotion();
  const last = SEQUENCE[0][2];
  const [count, setCount] = useState(last.length);

  useEffect(() => {
    if (reduce) {
      setCount(last.length);
      return;
    }
    const start = Math.max(0, last.length - 54);
    setCount(start);
    let i = start;
    const timer = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= last.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [reduce, last.length]);

  return (
    <Frame kicker="Sequence" title="Three notes. One voice." aside="Fortnight" tall>
      <ol className="flex flex-1 flex-col gap-2">
        {SEQUENCE.map(([day, subject, body], index) => (
          <li key={day} className="rounded-xl bg-background px-3 py-3 ring-1 ring-border">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-medium tracking-[0.14em] text-primary uppercase">{day}</span>
              <span className="text-[12px] text-muted-foreground">{index === 0 ? "Writing" : "Queued"}</span>
            </div>
            <div className="mt-1 text-[14px] font-medium">{subject}</div>
            <p className="mt-1 min-h-[2.6rem] text-[12.5px] leading-5 text-muted-foreground">
              {index === 0 ? (
                <>
                  {last.slice(0, count)}
                  {count < last.length ? (
                    <span className="ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-primary align-middle motion-safe:animate-pulse" />
                  ) : null}
                </>
              ) : (
                body
              )}
            </p>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

function ApproveScene() {
  const [done, setDone] = useState<string[]>([]);
  const left = QUEUE.filter((card) => !done.includes(card[0]));
  const front = left[0];
  return (
    <Frame kicker="Approvals" title="The queue waits on you" aside={`${left.length} held`} tall>
      <div className="relative min-h-[300px] flex-1">
        {left
          .slice(0, 3)
          .reverse()
          .map((card) => {
            const depth = left.indexOf(card);
            const isFront = depth === 0;
            return (
              <motion.article
                key={card[0]}
                layout
                className="absolute inset-x-0 top-0 rounded-xl bg-background p-4 ring-1 ring-border"
                style={{
                  transform: `translateY(${depth * 18}px) scale(${1 - depth * 0.035})`,
                  zIndex: 10 - depth,
                  opacity: 1 - depth * 0.08,
                }}
              >
                <div className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{card[0]}</div>
                <h3 className="mt-1 text-[18px] font-medium tracking-tight">{card[1]}</h3>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{card[2]}</p>
                {isFront && front ? (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDone((value) => [...value, front[0]])}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground"
                    >
                      <IconCircleCheckFilled size={14} />
                      Approve
                    </button>
                    <span className="rounded-full px-3 py-1.5 text-[12.5px] ring-1 ring-border">Hold</span>
                  </div>
                ) : null}
              </motion.article>
            );
          })}
        {left.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-start justify-center rounded-xl bg-background px-4 ring-1 ring-border">
            <IconCircleCheckFilled className="text-primary" />
            <p className="mt-2 text-[16px] font-medium">Queue clear.</p>
            <p className="text-[13px] text-muted-foreground">Three notes held. None sent.</p>
          </div>
        ) : null}
      </div>
    </Frame>
  );
}

function TrackScene() {
  const bars = [
    ["Found", 48],
    ["Yes", 11],
    ["Drafts", 4],
    ["Replies", 3],
    ["Meetings", 1],
  ] as const;
  return (
    <Frame kicker="Pipeline" title="From a sentence to a meeting" aside="This week" tall>
      <div className="grid flex-1 gap-3 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-end gap-2 rounded-xl bg-background p-3 ring-1 ring-border">
          {bars.map(([label, value]) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-40 w-full items-end rounded-md bg-accent/70">
                <motion.div
                  className="w-full rounded-md bg-primary"
                  initial={false}
                  animate={{ height: `${Math.max(8, value * 1.7)}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
                />
              </div>
              <span className="text-[12px] font-medium tabular-nums">{value}</span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-2">
          {REPLIES.map(([name, kind, when, note]) => (
            <li key={name} className="rounded-xl bg-background px-3 py-2.5 ring-1 ring-border">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium">{name}</span>
                <span className={`text-[11px] ${kind === "Silent" ? "text-muted-foreground" : "text-primary"}`}>
                  {kind}
                </span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-2 text-[12px] text-muted-foreground">
                <span className="truncate">{note}</span>
                <span className="shrink-0 tabular-nums">{when}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}
