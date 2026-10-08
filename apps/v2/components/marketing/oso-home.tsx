"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { IconArrowRight, IconMoon, IconSun } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { OsoLogo } from "@/components/oso-logo";
import { DeskScene, HeroDesk, type SceneId } from "@/components/marketing/home/scenes";
import { useIsDark, useTheme } from "@/lib/theme";

const LOGOS = [
  ["gmail", "Gmail"],
  ["outlook", "Outlook"],
  ["googlecalendar", "Calendar"],
  ["hubspot", "HubSpot"],
  ["salesforce", "Salesforce"],
  ["pipedrive", "Pipedrive"],
  ["apollo", "Apollo"],
  ["linkedin", "LinkedIn"],
  ["slack", "Slack"],
  ["notion", "Notion"],
  ["attio", "Attio"],
  ["calendly", "Calendly"],
  ["hunter", "Hunter"],
  ["googlesheets", "Sheets"],
  ["googledocs", "Docs"],
] as const;

const STEPS: { n: string; phase: SceneId; title: string; body: string }[] = [
  {
    n: "01",
    phase: "find",
    title: "Name the room",
    body: "One sentence. The table fills with people, places, and the signal that made them worth a look.",
  },
  {
    n: "02",
    phase: "judge",
    title: "Judge the fit",
    body: "A yes or a no, with the reason beside it. A no never becomes a draft.",
  },
  {
    n: "03",
    phase: "write",
    title: "Write the sequence",
    body: "Three short notes across a fortnight. The first one is still being finished.",
  },
  {
    n: "04",
    phase: "approve",
    title: "Clear the queue",
    body: "Stacked, held, and yours. Approve the front card or leave it where it is.",
  },
  {
    n: "05",
    phase: "track",
    title: "Read what came back",
    body: "Replies, silence, and the meeting that actually landed.",
  },
];

const FAQ = [
  ["Who is allowed to send?", "A person. The desk can finish a note. It cannot release one."],
  ["What does a no look like?", "A reason you can read. Weak fits and duplicates stop before a draft."],
  ["What has to be connected?", "A mailbox. A calendar if you want the meeting on it. The CRM can wait."],
  ["Where does the writing run?", "Kimi writes the note. A smaller judge model only answers yes or no."],
];

export function OsoHome() {
  const reduce = useReducedMotion();
  const { setTheme } = useTheme();
  const dark = useIsDark();
  const [solid, setSolid] = useState(false);
  const [step, setStep] = useState(0);
  const [cap, setCap] = useState(0);
  const [spot, setSpot] = useState({ x: 40, y: 30 });
  const { scrollYProgress } = useScroll();
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary"
        style={{ width: reduce ? "0%" : bar }}
      />
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          solid ? "border-b border-border bg-background/80 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-5">
          <Link href="/" className="flex items-center gap-2 text-[14px] font-medium">
            <OsoLogo size={18} />
            Oso-Ahia
          </Link>
          <nav className="ml-4 hidden items-center gap-5 text-[13px] text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#capabilities" className="hover:text-foreground">Capabilities</a>
            <a href="#proof" className="hover:text-foreground">Proof</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label={dark ? "Switch to light" : "Switch to dark"}
              onClick={() => setTheme(dark ? "light" : "dark")}
              className="flex size-8 items-center justify-center rounded-full hover:bg-accent"
            >
              {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
            <Link
              href="/app"
              className="rounded-full bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground"
            >
              Open the desk
            </Link>
          </div>
        </div>
      </header>

      <section
        data-shot="hero"
        className="relative overflow-hidden"
        onPointerMove={(event) => {
          if (reduce) return;
          const rect = event.currentTarget.getBoundingClientRect();
          setSpot({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 40%, black, transparent 75%)",
          }}
        />
        {!reduce ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(520px circle at ${spot.x}px ${spot.y}px, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%)`,
            }}
          />
        ) : null}
        <div className="relative mx-auto grid min-h-[100dvh] max-w-[1440px] items-center gap-8 px-6 pt-24 pb-16 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-[12px] font-medium tracking-[0.2em] text-primary uppercase">Outbound, held</p>
            <h1 className="mt-4 max-w-[10ch] text-[52px]/[0.92] font-medium tracking-[-0.04em] md:text-[84px]/[0.9]">
              Every send waits for a yes.
            </h1>
            <p className="mt-5 max-w-md text-[16px]/6 text-muted-foreground">
              Pick a room. Names, scores, and a held note appear before anything can leave.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground"
              >
                Open the desk
                <IconArrowRight size={16} />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center rounded-full px-4 py-2.5 text-[14px] ring-1 ring-border"
              >
                See the five beats
              </a>
            </div>
          </div>
          <HeroDesk />
        </div>
      </section>

      <section className="overflow-hidden border-y border-border">
        <p className="px-5 pt-8 text-center text-[12px] tracking-[0.14em] text-muted-foreground uppercase">
          The stack you already run
        </p>
        <div className="relative mt-4 pb-8">
          {reduce ? (
            <div className="flex flex-wrap justify-center gap-2 px-5">
              {LOGOS.map(([id, name]) => (
                <LogoPill key={id} id={id} name={name} />
              ))}
            </div>
          ) : (
            <div className="relative h-12 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
              <motion.div
                className="absolute top-1/2 flex w-max gap-2"
                style={{ y: "-50%" }}
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
              >
                {[...LOGOS, ...LOGOS].map(([id, name], index) => (
                  <LogoPill key={`${id}-${index}`} id={id} name={name} />
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </section>

      <section id="how" className="border-b border-border">
        <div className="mx-auto grid max-w-[1440px] items-start gap-6 px-6 py-10 lg:grid-cols-[38fr_62fr] lg:gap-8 lg:py-4">
          <div>
            <Reveal>
              <p className="text-[12px] tracking-[0.16em] text-primary uppercase">How a yes happens</p>
              <h2 className="mt-2 max-w-[14ch] text-[36px]/[1.05] font-medium tracking-tight md:text-[48px]">
                Five screens. One send.
              </h2>
            </Reveal>
            <div className="mt-2">
              {STEPS.map((item, index) => (
                <HowStep
                  key={item.n}
                  index={index}
                  active={step === index}
                  onEnter={setStep}
                  n={item.n}
                  title={item.title}
                  body={item.body}
                  phase={item.phase}
                />
              ))}
            </div>
          </div>
          <div className="sticky top-16 hidden self-start lg:block">
            <div className="mb-3 flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="tabular-nums text-foreground">{STEPS[step]?.n}</span>
              <span className="h-px flex-1 bg-border" />
              <span>{STEPS[step]?.title}</span>
            </div>
            <div className="relative min-h-[680px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={STEPS[step]?.phase}
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <DeskScene id={STEPS[step]?.phase ?? "find"} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section
        id="capabilities"
        className="relative border-b border-border"
        onPointerMove={(event) => {
          if (reduce) return;
          const rect = event.currentTarget.getBoundingClientRect();
          setSpot({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        }}
      >
        {!reduce ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(420px circle at ${spot.x}px ${spot.y}px, color-mix(in oklab, var(--primary) 14%, transparent), transparent 62%)`,
            }}
          />
        ) : null}
        <div className="relative mx-auto max-w-7xl px-5 py-20">
          <h2 className="max-w-[16ch] text-[36px] font-medium tracking-tight md:text-[48px]">
            The same desk, one job at a time.
          </h2>
          <div role="tablist" aria-label="Capabilities" className="mt-6 flex gap-2 overflow-x-auto">
            {STEPS.map((item, index) => (
              <button
                key={item.phase}
                type="button"
                role="tab"
                aria-selected={cap === index}
                onClick={() => setCap(index)}
                onMouseEnter={() => setCap(index)}
                onFocus={() => setCap(index)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] ring-1 transition-colors ${
                  cap === index
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-card text-muted-foreground ring-border hover:text-foreground"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <DeskScene id={STEPS[cap]?.phase ?? "find"} />
          </div>
        </div>
      </section>

      <section id="proof" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <p className="text-[12px] tracking-[0.16em] text-muted-foreground uppercase">Sample week</p>
          <h2 className="mt-2 max-w-[18ch] text-[36px] font-medium tracking-tight md:text-[48px]">
            Numbers from the desk, not from a customer.
          </h2>
          <Metrics />
          <div className="mt-6 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <WeekChart />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
                <p className="text-[12px] tracking-[0.14em] text-muted-foreground uppercase">A sheet</p>
                <p className="mt-3 text-[28px] font-medium tracking-tight">48 names.</p>
                <p className="mt-1 text-[14px] text-muted-foreground">No verdicts. A send button at the end of the row.</p>
              </div>
              <div className="rounded-2xl bg-card p-5 ring-1 ring-primary">
                <p className="text-[12px] tracking-[0.14em] text-primary uppercase">The desk</p>
                <p className="mt-3 text-[28px] font-medium tracking-tight">11 kept.</p>
                <p className="mt-1 text-[14px] text-muted-foreground">One draft in front. The rest still held.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="integrations" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <h2 className="max-w-[16ch] text-[36px] font-medium tracking-tight md:text-[44px]">
            Borrow the tools. Leave them in place.
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {LOGOS.map(([id, name]) => (
              <div
                key={id}
                className="flex items-center gap-2 rounded-xl bg-card px-3 py-3 text-[13px] ring-1 ring-border transition-colors hover:bg-accent"
              >
                <img src={`/brand/logos/${id}.svg`} alt="" className="size-5 object-contain" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[12px] tracking-[0.16em] text-primary uppercase">The send</p>
            <h2 className="mt-2 text-[36px] font-medium tracking-tight md:text-[48px]">
              Three notes. Zero of them gone.
            </h2>
            <p className="mt-3 max-w-md text-[15px]/6 text-muted-foreground">
              Approve the one in front. The two behind it stay stacked until you get there.
            </p>
          </div>
          <DeskScene id="approve" />
        </div>
      </section>

      <section id="pricing" className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="max-w-[12ch] text-[40px] font-medium tracking-tight md:text-[56px]">
              One desk to start.
            </h2>
            <p className="mt-4 max-w-md text-[15px]/6 text-muted-foreground">
              Open it and work the sample. A number shows up with the next seat, not on this page.
            </p>
            <Link
              href="/app"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground"
            >
              Open the desk
              <IconArrowRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border">
            {[
              ["This desk", "Open", "You, a mailbox, and the queue."],
              ["The next seat", "Later", "Shared lists when a second person arrives."],
              ["A whole house", "Write to us", "Your domain and your rules for the send."],
            ].map(([name, mark, body]) => (
              <div key={name} className="flex items-baseline justify-between gap-4 px-5 py-4">
                <div>
                  <div className="text-[15px] font-medium">{name}</div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{body}</p>
                </div>
                <div className="shrink-0 text-[12px] font-medium tracking-[0.14em] text-primary uppercase">
                  {mark}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <h2 className="text-[36px] font-medium tracking-tight md:text-[48px]">Before you open it</h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border sm:grid-cols-2">
            {FAQ.map(([q, a]) => (
              <div key={q} className="bg-card px-5 py-5">
                <h3 className="text-[16px] font-medium">{q}</h3>
                <p className="mt-2 text-[14px]/6 text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-foreground text-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--primary) 45%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 45%, transparent) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-24 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[12ch] text-[48px]/[0.95] font-medium tracking-[-0.04em] md:text-[72px]">
            Hold the next send.
          </h2>
          <Link
            href="/app"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground"
          >
            Open the desk
            <IconArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-[12px] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span className="text-foreground">Oso-Ahia</span>
          <nav className="flex gap-4">
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">Questions</a>
            <Link href="/app">Desk</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function LogoPill({ id, name }: { id: string; name: string }) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full bg-card px-3 text-[13px] ring-1 ring-border">
      <img src={`/brand/logos/${id}.svg`} alt="" className="size-4 object-contain" />
      {name}
    </span>
  );
}

function Reveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

function HowStep({
  index,
  active,
  onEnter,
  n,
  title,
  body,
  phase,
}: {
  index: number;
  active: boolean;
  onEnter: (index: number) => void;
  n: string;
  title: string;
  body: string;
  phase: SceneId;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onEnter(index);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [index, onEnter]);

  return (
    <div
      ref={ref}
      data-shot={phase}
      className={`flex flex-col justify-center border-t border-border py-8 pl-4 transition-opacity lg:min-h-[70vh] lg:py-4 ${
        active ? "border-l-2 border-l-primary opacity-100" : "border-l-2 border-l-transparent opacity-40"
      }`}
    >
      <div className="text-[12px] text-muted-foreground tabular-nums">{n}</div>
      <h3 className="mt-1 max-w-[14ch] text-[28px] font-medium tracking-tight md:text-[36px]">{title}</h3>
      <p className="mt-2 max-w-sm text-[14px]/6 text-muted-foreground">{body}</p>
      <div className="mt-5 lg:hidden">
        <DeskScene id={phase} />
      </div>
    </div>
  );
}

const METRICS = [
  { value: 48, label: "Names from one sentence" },
  { value: 11, label: "Kept by the judge" },
  { value: 4, label: "Drafts still held" },
  { value: 0, label: "Sent without a yes" },
];

function Metrics() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setOn(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      {METRICS.map((item) => (
        <div key={item.label} className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="text-[40px] font-medium tracking-tight tabular-nums">
            <span className="relative inline-grid">
              <span className="invisible col-start-1 row-start-1">{item.value}</span>
              <span className="col-start-1 row-start-1">
                <Counter value={item.value} run={on} />
              </span>
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function Counter({ value, run }: { value: number; run: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (reduce || value === 0) {
      setN(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      setN(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setN(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, run, value]);
  return <>{n}</>;
}

const WEEK = [
  ["Mon", 2],
  ["Tue", 4],
  ["Wed", 3],
  ["Thu", 6],
  ["Fri", 5],
] as const;

function WeekChart() {
  const reduce = useReducedMotion();
  const [hot, setHot] = useState<number | null>(null);
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] text-muted-foreground">Replies in the sample week</p>
        <p className="text-[12px] tabular-nums text-muted-foreground">
          {hot === null ? "20" : WEEK[hot]?.[1]} replies
        </p>
      </div>
      <div className="relative mt-4 h-36">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between">
          {[0, 1, 2].map((line) => (
            <span key={line} className="border-t border-border" />
          ))}
        </div>
        <div className="relative flex h-full items-end gap-3">
          {WEEK.map(([day, value], index) => (
            <button
              key={day}
              type="button"
              onMouseEnter={() => setHot(index)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(index)}
              onBlur={() => setHot(null)}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <motion.span
                className={`w-full rounded-sm ${hot === index ? "bg-primary" : "bg-primary/80"}`}
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.04 }}
                style={{ height: `${value * 14}%`, transformOrigin: "bottom" }}
              />
              <span className="text-[11px] text-muted-foreground">{day}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
