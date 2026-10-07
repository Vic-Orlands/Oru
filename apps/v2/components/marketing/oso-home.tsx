"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCircleCheckFilled,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";

import { OsoLogo } from "@/components/oso-logo";
import { useIsDark, useTheme } from "@/lib/theme";

const LOGOS = [
  ["gmail", "Gmail"],
  ["outlook", "Outlook"],
  ["googlecalendar", "Google Calendar"],
  ["hubspot", "HubSpot"],
  ["salesforce", "Salesforce"],
  ["pipedrive", "Pipedrive"],
  ["apollo", "Apollo"],
  ["linkedin", "LinkedIn"],
  ["slack", "Slack"],
  ["notion", "Notion"],
] as const;

const STAGES = [
  {
    kicker: "Find",
    title: "Clinic groups that still book by hand",
    body: (
      <ul className="flex flex-col gap-1.5 text-[12.5px]">
        {["Amaka Adeyemi · Halcyon", "Jonah Ellis · Fieldnote", "Priya Raman · Northspan"].map(
          (row) => (
            <li key={row} className="flex items-center justify-between gap-3">
              <span className="truncate">{row}</span>
              <span className="text-[11px] text-neutral-500">new</span>
            </li>
          ),
        )}
      </ul>
    ),
  },
  {
    kicker: "Score",
    title: "Jev keeps the strong fits",
    body: (
      <ul className="flex flex-col gap-1.5 text-[12.5px]">
        {[
          ["Amaka Adeyemi", "92"],
          ["Jonah Ellis", "81"],
          ["Priya Raman", "74"],
        ].map(([name, score]) => (
          <li key={name} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="tabular-nums text-neutral-500">{score}</span>
            <span className="rounded-full bg-[#f3e6d8] px-1.5 py-0.5 text-[10px] text-[#7a4e2d]">
              Strong
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    kicker: "Draft",
    title: "A quieter way to fill Thursday’s clinics",
    body: (
      <p className="text-[12.5px]/5 text-neutral-600">
        Amaka — Halcyon’s Ikeja site still shows an 11-day wait. We book the first consult before
        the coordinators open the spreadsheet.
      </p>
    ),
  },
  {
    kicker: "Approve",
    title: "Nothing sends until you say yes",
    body: (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#8a5a32] px-2.5 py-1 text-[12px] font-medium text-white">
          <IconCircleCheckFilled size={13} />
          Approve and queue
        </span>
        <span className="rounded-full px-2.5 py-1 text-[12px] ring-1 ring-black/10">Hold</span>
      </div>
    ),
  },
] as const;

const WALK = [
  {
    n: "01",
    title: "Name the room",
    body: "One sentence. City, size, the job that actually feels the wait.",
  },
  {
    n: "02",
    title: "The desk finds them",
    body: "Names, titles, and a score. The weak fits never become a draft.",
  },
  {
    n: "03",
    title: "A sequence, in your voice",
    body: "Short notes across a fortnight. No circling back. No fake familiarity.",
  },
  {
    n: "04",
    title: "You approve the send",
    body: "Gmail and the calendar wait. Hold is a complete answer.",
  },
];

const FAQ = [
  [
    "Does it send email on its own?",
    "No. Drafts queue for approval. You can hold a step, edit it, or let the sequence continue.",
  ],
  [
    "Which model writes?",
    "Kimi K2, through OpenRouter. Fast yes/no calls go to Jev, with a cheap structured model behind it.",
  ],
  [
    "What do I connect?",
    "Gmail and a calendar are enough. The store is Composio, plus any MCP server you already trust.",
  ],
  [
    "Can I look around without keys?",
    "Yes. Demo mode opens a sample workspace: the desk, the lists, and a chat already mid-reply.",
  ],
];

function StagePanel({
  frame,
  stage,
}: {
  frame: (typeof STAGES)[number];
  stage: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] ring-1 ring-black/10">
      <div className="flex items-center justify-between border-b border-black/8 px-4 py-2.5 text-[12px] text-neutral-500">
        <span>New chat</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          Kimi
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px]">Clinic groups in Lagos that still book new patients by hand.</p>
        <div className="mt-3 min-h-[148px] rounded-xl bg-[#f6f4f0] p-3 ring-1 ring-black/8">
          <AnimatePresence mode="wait">
            <motion.div
              key={frame.kicker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
            >
              <div className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                {frame.kicker}
              </div>
              <div className="mt-1 text-[13.5px] font-medium">{frame.title}</div>
              <div className="mt-2">{frame.body}</div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STAGES.map((item, index) => (
            <span
              key={item.kicker}
              className={`h-1 flex-1 rounded-full ${index === stage ? "bg-[#8a5a32]" : "bg-neutral-200"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function OsoHome() {
  const { setTheme } = useTheme();
  const dark = useIsDark();
  const [stage, setStage] = useState(0);
  const [walk, setWalk] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStage((current) => (current + 1) % STAGES.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  const frame = STAGES[stage] ?? STAGES[0];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <section className="relative min-h-[100dvh] overflow-hidden">
        <img
          src="/brand/hero-loft.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/75" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <header className="relative mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 text-white">
          <Link href="/" className="flex items-center gap-2 text-[14px] font-medium">
            <OsoLogo size={18} className="text-white" />
            Oso-Ahia
          </Link>
          <nav className="ml-6 hidden items-center gap-5 text-[13px] text-white/75 md:flex">
            <a href="#how">How it works</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(dark ? "light" : "dark")}
              className="flex size-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
            >
              {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
            <Link
              href="/app"
              className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-950"
            >
              Open the desk
            </Link>
          </div>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 pb-28 md:grid-cols-[0.9fr_1.1fr] md:pt-16 md:pb-36">
          <div className="text-white">
            <p className="text-[12px] font-medium tracking-[0.18em] text-white/70 uppercase">
              Sales lead desk
            </p>
            <h1 className="mt-3 max-w-[14ch] text-[40px]/[1.05] font-medium tracking-tight md:text-[56px]/[1.02]">
              Find the room. Wait for the yes.
            </h1>
            <p className="mt-4 max-w-md text-[15px]/6 text-white/75">
              A chat for outbound. You describe who should hear from you. The desk finds them,
              writes the sequence, and holds every send.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13.5px] font-medium text-neutral-950"
              >
                Look around
                <IconArrowRight size={15} />
              </Link>
              <a href="#how" className="text-[13.5px] text-white/70">
                See a send happen
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]"
          >
            <StagePanel frame={frame} stage={stage} />
          </motion.div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-border">
        <div className="mx-auto max-w-6xl px-5 pt-8">
          <p className="text-[12px] tracking-[0.14em] text-muted-foreground uppercase">
            Connect what you already sell with
          </p>
        </div>
        <div className="relative mt-4 pb-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
          <motion.div
            className="flex w-max items-center gap-3"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          >
            {[...LOGOS, ...LOGOS].map(([id, name], index) => (
              <span
                key={`${id}-${index}`}
                className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-[13px] ring-1 ring-border"
              >
                <img
                  src={`/brand/logos/${id}.svg`}
                  alt=""
                  className="size-5 object-contain"
                />
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="how" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="text-[28px] font-medium tracking-tight">How a send happens</h2>
            <p className="mt-3 max-w-sm text-[14px]/6 text-muted-foreground">
              Four beats. The chat does the finding and the writing. You keep the yes.
            </p>
            <div className="mt-6">
              {WALK.map((step, index) => (
                <WalkStep
                  key={step.n}
                  active={index === walk}
                  n={step.n}
                  title={step.title}
                  body={step.body}
                  onEnter={() => setWalk(index)}
                />
              ))}
            </div>
          </div>
          <div className="md:sticky md:top-16">
            <StagePanel frame={STAGES[walk] ?? STAGES[0]} stage={walk} />
          </div>
        </div>
      </section>

      <section id="capabilities" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-[28px] font-medium tracking-tight">What the chat can do</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <Capability
              title="Find"
              body="Prospects from a sentence, not a filter maze."
              visual={
                <div className="w-full space-y-1 text-[11px]">
                  {["Amaka · Halcyon", "Jonah · Fieldnote"].map((row) => (
                    <div key={row} className="flex items-center justify-between rounded-md bg-accent px-2 py-1">
                      <span className="truncate">{row}</span>
                      <span className="text-muted-foreground">new</span>
                    </div>
                  ))}
                </div>
              }
            />
            <Capability
              title="Qualify"
              body="A yes/no judge for fit, intent, and duplicates."
              visual={
                <div className="flex w-full items-center gap-2 text-[12px]">
                  <span className="tabular-nums">92</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
                    <span className="block h-full w-[92%] rounded-full bg-primary" />
                  </span>
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                    Strong
                  </span>
                </div>
              }
            />
            <Capability
              title="Write"
              body="Multi-step sequences that sound like a person."
              visual={
                <p className="line-clamp-2 text-[12px]/4 text-muted-foreground">
                  Amaka — the Ikeja site still shows an 11-day wait. We book the first consult
                  before the spreadsheet opens.
                </p>
              }
            />
            <Capability
              title="Approve"
              body="Every email waits in a card you can hold."
              visual={
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[12px] font-medium text-primary-foreground">
                  <IconCircleCheckFilled size={13} />
                  Approve and queue
                </span>
              }
            />
            <Capability
              title="Send"
              body="Gmail, Outlook, and the calendar, through Composio."
              visual={
                <span className="flex gap-1.5">
                  {["gmail", "outlook", "googlecalendar"].map((id) => (
                    <img key={id} src={`/brand/logos/${id}.svg`} alt="" className="size-5" />
                  ))}
                </span>
              }
            />
            <Capability
              title="Track"
              body="Replies, meetings, and the funnel between them."
              visual={
                <div className="flex w-full items-end gap-2 text-[11px] text-muted-foreground">
                  {[
                    ["106", "found"],
                    ["41", "fit"],
                    ["9", "replies"],
                    ["4", "meetings"],
                  ].map(([n, label], index) => (
                    <div key={label} className="flex-1">
                      <div
                        className="mb-1 rounded-sm bg-primary/80"
                        style={{ height: 28 - index * 6 }}
                      />
                      <div className="tabular-nums text-foreground">{n}</div>
                      <div>{label}</div>
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-[28px] font-medium tracking-tight">Approval is the product</h2>
            <p className="mt-3 max-w-md text-[14px]/6 text-muted-foreground">
              The agent can queue mail, book a meeting, and update the CRM. It cannot skip you.
              A draft is a card. Approve it, hold it, or rewrite the line that sounds wrong.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <div className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Needs your yes
            </div>
            <div className="mt-1 text-[15px] font-medium">
              A quieter way to fill Thursday’s clinics
            </div>
            <p className="mt-2 text-[13px]/5 text-muted-foreground">
              Amaka — Halcyon’s Ikeja site still shows an 11-day wait. We book the first consult
              before your coordinators open the spreadsheet.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground">
              <IconCircleCheckFilled size={14} />
              Approve and queue
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-[28px] font-medium tracking-tight">Pricing</h2>
          <p className="mt-2 max-w-lg text-[13.5px] text-muted-foreground">
            Private while the first desks are in use. Seats, not surprise overages.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              ["Desk", "One person, their own outbound, the sample workspace you can open now.", "Private"],
              ["Team", "Shared lists, shared approvals, one voice across the seats.", "Private"],
              ["House", "Your CRM, your domain, your rules. Talk to us when the send path is live.", "Conversation"],
            ].map(([name, body, price]) => (
              <div key={name} className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-border">
                <div className="text-[14px] font-medium">{name}</div>
                <p className="mt-2 flex-1 text-[13px]/5 text-muted-foreground">{body}</p>
                <div className="mt-5 text-[13px] font-medium tracking-wide text-foreground/80 uppercase">
                  {price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-border">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <h2 className="text-[28px] font-medium tracking-tight">Questions</h2>
          <div className="mt-6 divide-y divide-border">
            {FAQ.map(([q, a]) => (
              <Faq key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-5 py-16 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-md text-[28px] font-medium tracking-tight">
            Open the desk. The sample workspace is already warm.
          </h2>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13.5px] font-medium text-primary-foreground"
          >
            Open Oso-Ahia
            <IconArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-[12px] text-muted-foreground md:flex-row md:justify-between">
          <span>Oso-Ahia</span>
          <span>
            Built on{" "}
            <a className="underline" href="https://github.com/whirlchat/whirl">
              Whirl
            </a>{" "}
            by Anterra, MIT licensed.
          </span>
        </div>
      </footer>
    </div>
  );
}

function WalkStep({
  n,
  title,
  body,
  active,
  onEnter,
}: {
  n: string;
  title: string;
  body: string;
  active: boolean;
  onEnter: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onEnter();
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onEnter]);

  return (
    <div
      ref={ref}
      className={`border-t border-border py-7 transition-opacity ${active ? "opacity-100" : "opacity-45"}`}
    >
      <div className="text-[12px] text-muted-foreground tabular-nums">{n}</div>
      <h3 className="mt-1 text-[18px] font-medium tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px]/5 text-muted-foreground">{body}</p>
    </div>
  );
}

function Capability({
  title,
  body,
  visual,
}: {
  title: string;
  body: string;
  visual: ReactNode;
}) {
  return (
    <div className="flex min-h-[148px] flex-col rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="mb-3 flex min-h-12 items-center">{visual}</div>
      <div className="text-[14px] font-medium">{title}</div>
      <p className="mt-1 text-[13px]/5 text-muted-foreground">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" onClick={() => setOpen((value) => !value)} className="block w-full py-3 text-left">
      <div className="text-[14px] font-medium">{q}</div>
      {open && <p className="mt-1.5 text-[13px]/5 text-muted-foreground">{a}</p>}
    </button>
  );
}
