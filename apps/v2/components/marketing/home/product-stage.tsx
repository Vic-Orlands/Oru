"use client";

import { useEffect, useRef, useState } from "react";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

export type StagePhase = "type" | "find" | "score" | "draft" | "approve" | "queued" | "track";

const PROMPT = "Clinic groups in Lagos that still book by hand.";

const PEOPLE = [
  { name: "Amaka Adeyemi", meta: "Halcyon Clinics", score: 92 },
  { name: "Jonah Ellis", meta: "Fieldnote", score: 81 },
  { name: "Priya Raman", meta: "Northspan", score: 74 },
];

const ORDER: StagePhase[] = ["type", "find", "score", "draft", "approve"];

const TONE = {
  paper: {
    card: "bg-white text-neutral-950 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.55)] ring-black/10",
    header: "border-black/8 text-neutral-500",
    muted: "text-neutral-500",
    well: "bg-[#f6f4f0] ring-black/8",
    chip: "bg-[#f3e6d8] text-[#7a4e2d]",
    btn: "bg-[#8a5a32] text-white",
    hold: "text-neutral-700 ring-black/15",
    bar: "bg-[#8a5a32]",
    track: "bg-neutral-200",
  },
  theme: {
    card: "bg-card text-foreground shadow-[0_24px_60px_-32px_rgba(0,0,0,0.45)] ring-border",
    header: "border-border text-muted-foreground",
    muted: "text-muted-foreground",
    well: "bg-background ring-border",
    chip: "bg-primary/15 text-primary",
    btn: "bg-primary text-primary-foreground",
    hold: "text-foreground ring-border",
    bar: "bg-primary",
    track: "bg-accent",
  },
} as const;

function atLeast(phase: StagePhase, mark: StagePhase) {
  const order = ["type", "find", "score", "draft", "approve", "queued", "track"];
  return order.indexOf(phase) >= order.indexOf(mark);
}

export function ProductStage({
  phase: controlled = "approve",
  live = false,
  paper = false,
  compact = false,
}: {
  phase?: StagePhase;
  /** Types, streams prospects, then waits for Approve. */
  live?: boolean;
  paper?: boolean;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const tone = paper ? TONE.paper : TONE.theme;
  const [phase, setPhase] = useState<StagePhase>(live ? "type" : controlled);
  const [chars, setChars] = useState(live ? 0 : PROMPT.length);
  const [run, setRun] = useState(0);
  const held = useRef(false);

  useEffect(() => {
    if (!live) {
      setPhase(controlled);
      setChars(PROMPT.length);
    }
  }, [controlled, live]);

  useEffect(() => {
    if (!live) return;
    held.current = false;
    if (reduce) {
      setChars(PROMPT.length);
      setPhase("approve");
      return;
    }

    setChars(0);
    setPhase("type");
    const timers: number[] = [];
    let i = 0;
    const type = window.setInterval(() => {
      i += 1;
      setChars(i);
      if (i >= PROMPT.length) window.clearInterval(type);
    }, 28);
    timers.push(type);

    const after = PROMPT.length * 28;
    ORDER.slice(1).forEach((next, index) => {
      timers.push(
        window.setTimeout(() => {
          if (!held.current) setPhase(next);
        }, after + 420 + index * 780),
      );
    });

    return () => {
      timers.forEach((id) => {
        window.clearInterval(id);
        window.clearTimeout(id);
      });
    };
  }, [live, reduce, run]);

  const shown = phase;
  const typed = PROMPT.slice(0, live ? chars : PROMPT.length);
  const showPeople = atLeast(shown, "find") || shown === "track";
  const showScores = atLeast(shown, "score") || shown === "track";
  const showDraft = atLeast(shown, "draft") && shown !== "track";
  const showActions = shown === "approve" || shown === "queued";
  const queued = shown === "queued";

  return (
    <div className={`overflow-hidden rounded-2xl ring-1 ${tone.card}`}>
      <div className={`flex items-center justify-between border-b px-4 py-2.5 text-[12px] ${tone.header}`}>
        <span>New chat</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Kimi
        </span>
      </div>
      <div className={compact ? "px-3 py-3" : "px-4 py-4"}>
        <p className={`min-h-[2.6rem] text-[13.5px] ${compact ? "min-h-0" : ""}`}>
          {typed}
          {live && shown === "type" && chars < PROMPT.length ? (
            <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-current align-middle motion-safe:animate-pulse" />
          ) : null}
        </p>
        <div className={`mt-3 rounded-xl p-3 ring-1 ${tone.well} ${compact ? "min-h-[168px]" : "min-h-[228px]"}`}>
          {shown === "track" ? (
            <Track tone={tone} />
          ) : (
            <>
              {showPeople ? (
                <ul className="flex flex-col gap-1.5">
                  {PEOPLE.map((person, index) => (
                    <motion.li
                      key={person.name}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduce ? 0 : index * 0.08, duration: 0.35 }}
                      className="flex items-center gap-2 text-[12.5px]"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {person.name}
                        <span className={`ml-1.5 ${tone.muted}`}>{person.meta}</span>
                      </span>
                      {showScores ? (
                        <>
                          <span className="tabular-nums">{person.score}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tone.chip}`}>
                            Strong
                          </span>
                        </>
                      ) : (
                        <span className={`text-[11px] ${tone.muted}`}>finding</span>
                      )}
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className={`text-[12.5px] ${tone.muted}`}>Waiting for the room.</p>
              )}
              {showDraft ? (
                <p className={`mt-3 text-[12.5px]/5 ${tone.muted}`}>
                  Amaka — the Ikeja site still shows an 11-day wait. We book the first consult
                  before the spreadsheet opens.
                </p>
              ) : null}
              {showActions ? (
                <div className="mt-3 flex items-center gap-2">
                  {queued ? (
                    <span className={`inline-flex items-center gap-1 text-[12.5px] font-medium ${tone.muted}`}>
                      <IconCircleCheckFilled size={14} className="text-emerald-600" />
                      Queued. Nothing else leaves.
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          held.current = true;
                          setPhase("queued");
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-medium ${tone.btn}`}
                      >
                        <IconCircleCheckFilled size={13} />
                        Approve
                      </button>
                      <span className={`rounded-full px-3 py-1.5 text-[12.5px] ring-1 ${tone.hold}`}>
                        Hold
                      </span>
                    </>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
        {live ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex flex-1 gap-1">
              {ORDER.map((item) => (
                <span
                  key={item}
                  className={`h-1 flex-1 rounded-full ${atLeast(shown, item) && shown !== "track" ? tone.bar : tone.track}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRun((value) => value + 1)}
              className={`text-[11px] ${tone.muted}`}
            >
              Replay
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Track({ tone }: { tone: (typeof TONE)["paper"] | (typeof TONE)["theme"] }) {
  const bars = [42, 28, 18, 9, 4];
  const labels = ["Found", "Fit", "Drafts", "Yes", "Meetings"];
  return (
    <div className="flex h-full items-end gap-2 pt-2">
      {bars.map((value, index) => (
        <div key={labels[index]} className="flex flex-1 flex-col items-center gap-1">
          <div className={`flex h-24 w-full items-end rounded-sm ${tone.track}`}>
            <div
              className={`w-full rounded-sm ${tone.bar}`}
              style={{ height: `${value * 2}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums">{value}</span>
          <span className={`text-[10px] ${tone.muted}`}>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}
