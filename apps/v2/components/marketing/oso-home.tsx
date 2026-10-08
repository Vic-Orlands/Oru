"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { IconArrowRight, IconMoon, IconSun } from "@tabler/icons-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { OsoLogo } from "@/components/oso-logo";
import { ProductStage, type StagePhase } from "@/components/marketing/home/product-stage";
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

const STEPS: { n: string; phase: StagePhase; title: string; body: string }[] = [
  {
    n: "01",
    phase: "find",
    title: "Name the room",
    body: "One sentence. City, size, the job that actually feels the wait.",
  },
  {
    n: "02",
    phase: "score",
    title: "Keep the strong fits",
    body: "A yes-or-no judge. Anyone weak never becomes a draft.",
  },
  {
    n: "03",
    phase: "draft",
    title: "Write the note",
    body: "Short, specific, and in your voice. No fake familiarity.",
  },
  {
    n: "04",
    phase: "approve",
    title: "Hold the send",
    body: "Approve it, hold it, or rewrite the line that sounds wrong.",
  },
  {
    n: "05",
    phase: "track",
    title: "Watch the reply",
    body: "Meetings, silence, and the next note — in one place.",
  },
];

const CAPABILITIES = [
  {
    id: "find",
    title: "Find",
    body: "A sentence becomes a list. No filter maze.",
  },
  {
    id: "qualify",
    title: "Qualify",
    body: "Fit, timing, and a duplicate check. Then a score.",
  },
  {
    id: "write",
    title: "Write",
    body: "A sequence across a fortnight, not a brochure.",
  },
  {
    id: "approve",
    title: "Approve",
    body: "The email is a card. Yes and hold are both complete.",
  },
  {
    id: "track",
    title: "Track",
    body: "From found, to fit, to a meeting on the calendar.",
  },
] as const;

const METRICS = [
  { value: 48, label: "Names from one sentence" },
  { value: 11, label: "Kept after the judge" },
  { value: 4, label: "Drafts waiting on you" },
  { value: 0, label: "Sent without a yes" },
];

const FAQ = [
  ["Does it send on its own?", "No. Every draft waits. Hold is a finished answer."],
  ["What do I connect?", "Gmail and a calendar are enough. The rest of the store is optional."],
  ["Which model writes?", "Kimi, through OpenRouter. Fast yes-or-no calls go to a judge model."],
  ["Can I look without keys?", "Yes. The sample desk opens with a chat already in motion."],
];

export function OsoHome() {
  const reduce = useReducedMotion();
  const { setTheme } = useTheme();
  const dark = useIsDark();
  const [solid, setSolid] = useState(false);
  const [step, setStep] = useState(0);
  const [cap, setCap] = useState(0);
  const [spot, setSpot] = useState({ x: 50, y: 30 });

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          solid
            ? "border-b border-border bg-background/85 text-foreground backdrop-blur-md"
            : "border-b border-transparent bg-transparent text-white"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5">
          <Link href="/" className="flex items-center gap-2 text-[14px] font-medium">
            <OsoLogo size={18} className={solid ? "" : "text-white"} />
            Oso-Ahia
          </Link>
          <nav className="ml-4 hidden items-center gap-5 text-[13px] opacity-75 md:flex">
            <a href="#how">How it works</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#proof">Proof</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label={dark ? "Switch to light" : "Switch to dark"}
              onClick={() => setTheme(dark ? "light" : "dark")}
              className={`flex size-8 items-center justify-center rounded-full ${
                solid ? "hover:bg-accent" : "hover:bg-white/10"
              }`}
            >
              {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
            <Link
              href="/app"
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
                solid
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-neutral-950"
              }`}
            >
              Open the desk
            </Link>
          </div>
        </div>
      </header>

      <Hero />

      <section className="overflow-hidden border-b border-border">
        <p className="px-5 pt-8 text-center text-[12px] tracking-[0.14em] text-muted-foreground uppercase">
          Connect what you already sell with
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
        <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-8">
          <div>
            <Reveal>
              <h2 className="text-[32px] font-medium tracking-tight md:text-[40px]">How a yes happens</h2>
              <p className="mt-2 max-w-sm text-[14px]/6 text-muted-foreground">
                Five beats. The chat does the finding and the writing. You keep the send.
              </p>
            </Reveal>
            <div className="mt-4">
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
          <div className="sticky top-[calc(50vh-11rem)] hidden self-start md:block">
            <p className="mb-3 text-[12px] tracking-[0.14em] text-muted-foreground uppercase">
              {STEPS[step]?.n} · {STEPS[step]?.title}
            </p>
            <ProductStage phase={STEPS[step]?.phase ?? "find"} />
          </div>
        </div>
      </section>

      <section
        id="capabilities"
        className="relative border-b border-border"
        onPointerMove={(event) => {
          if (reduce) return;
          const rect = event.currentTarget.getBoundingClientRect();
          setSpot({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }}
      >
        {!reduce ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(380px circle at ${spot.x}px ${spot.y}px, color-mix(in oklab, var(--primary) 18%, transparent), transparent 62%)`,
            }}
          />
        ) : null}
        <div className="relative mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-[32px] font-medium tracking-tight md:text-[40px]">What the chat can do</h2>
          </Reveal>
          <div
            role="tablist"
            aria-label="Capabilities"
            className="mt-6 flex gap-2 overflow-x-auto"
          >
            {CAPABILITIES.map((item, index) => (
              <button
                key={item.id}
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
          <div className="mt-4 grid min-h-[240px] gap-6 rounded-2xl bg-card p-5 ring-1 ring-border md:grid-cols-[0.8fr_1.2fr] md:p-6">
            <div>
              <h3 className="text-[20px] font-medium tracking-tight">
                {CAPABILITIES[cap]?.title}
              </h3>
              <p className="mt-2 text-[14px]/6 text-muted-foreground">{CAPABILITIES[cap]?.body}</p>
              <Link
                href="/app"
                className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-primary"
              >
                Try it on the desk
                <IconArrowRight size={14} />
              </Link>
            </div>
            <div className="overflow-hidden rounded-xl bg-background ring-1 ring-border">
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
                <span className="size-1.5 rounded-full bg-primary/70" />
                <span className="text-[11px] text-muted-foreground">Desk · {CAPABILITIES[cap]?.title}</span>
              </div>
              <div className="p-3">
                <CapabilityVisual id={CAPABILITIES[cap]?.id ?? "find"} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="proof" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <p className="text-[12px] tracking-[0.14em] text-muted-foreground uppercase">
              Sample workspace
            </p>
            <h2 className="mt-2 max-w-xl text-[32px] font-medium tracking-tight md:text-[40px]">
              A week on the desk, not a customer claim.
            </h2>
          </Reveal>
          <Metrics />
          <div className="mt-8 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <WeekChart />
            <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <p className="text-[12px] text-muted-foreground">Without the desk / with it</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <p className="text-[12px] text-muted-foreground">Sheet</p>
                  <p className="mt-2">48 names.</p>
                  <p className="text-muted-foreground">No scores.</p>
                  <p className="text-muted-foreground">A send button.</p>
                </div>
                <div>
                  <p className="text-[12px] text-primary">Desk</p>
                  <p className="mt-2">11 kept.</p>
                  <p>One draft.</p>
                  <p>Waiting on you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="integrations" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-[32px] font-medium tracking-tight md:text-[40px]">The tools stay where they are</h2>
            <p className="mt-2 max-w-md text-[14px]/6 text-muted-foreground">
              Gmail, the calendar, the CRM. The desk borrows them. It does not replace the stack.
            </p>
          </Reveal>
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
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-20 md:grid-cols-2">
          <Reveal>
            <p className="text-[12px] tracking-[0.14em] text-muted-foreground uppercase">
              Approval is the product
            </p>
            <h2 className="mt-2 text-[32px] font-medium tracking-tight md:text-[40px]">
              The agent can queue mail. It cannot skip you.
            </h2>
            <p className="mt-3 max-w-md text-[14px]/6 text-muted-foreground">
              A draft is a card. Approve it, hold it, or change the sentence that doesn’t sound
              like you.
            </p>
          </Reveal>
          <ProductStage phase="approve" />
        </div>
      </section>

      <section id="pricing" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-[32px] font-medium tracking-tight md:text-[40px]">Desks open one at a time</h2>
            <p className="mt-2 max-w-lg text-[14px]/6 text-muted-foreground">
              No public price list yet. Seats, not surprise overages, when a desk is live.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              ["Desk", "One person. Their own outbound. The sample workspace is open now.", "Private"],
              ["Team", "Shared lists, shared approvals, one voice across the seats.", "Private"],
              ["House", "Your CRM, your domain, your rules for the send.", "Conversation"],
            ].map(([name, body, price], index) => (
              <div
                key={name}
                className={`flex flex-col rounded-2xl bg-card p-5 ring-1 ${
                  index === 1 ? "ring-primary" : "ring-border"
                }`}
              >
                <div className="text-[14px] font-medium">{name}</div>
                <p className="mt-2 flex-1 text-[13px]/5 text-muted-foreground">{body}</p>
                <div className="mt-6 text-[12px] font-medium tracking-[0.14em] uppercase">
                  {price}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/app"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13.5px] font-medium text-primary-foreground"
          >
            Open the sample desk
            <IconArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section id="faq" className="border-b border-border">
        <div className="mx-auto max-w-2xl px-5 py-20">
          <h2 className="text-[32px] font-medium tracking-tight md:text-[40px]">Questions</h2>
          <div className="mt-6 divide-y divide-border">
            {FAQ.map(([q, a]) => (
              <Faq key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <img
          src="/brand/hero-loft.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_60%]"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-5 px-5 py-24 text-white md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-lg text-[32px]/[1.1] font-medium tracking-tight md:text-[40px]">
            The sample desk is already warm.
          </h2>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13.5px] font-medium text-neutral-950"
          >
            Open Oso-Ahia
            <IconArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-[12px] text-muted-foreground md:flex-row md:items-center md:justify-between">
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

function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);

  return (
    <section ref={ref} className="relative min-h-[100dvh] overflow-hidden">
      <motion.img
        src="/brand/hero-loft.jpg"
        alt=""
        style={reduce ? undefined : { y, scale: 1.12 }}
        className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/20" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-10 px-5 pt-24 pb-28 md:grid-cols-[0.9fr_1.1fr] md:pt-20">
        <div className="text-white">
          <p className="text-[12px] font-medium tracking-[0.18em] text-white/70 uppercase">
            Sales desk
          </p>
          <h1 className="mt-3 max-w-[11ch] text-[42px]/[1.02] font-medium tracking-tight md:text-[68px]/[0.96]">
            Every send waits for a yes.
          </h1>
          <p className="mt-4 max-w-md text-[15px]/6 text-white/78">
            Describe who should hear from you. The desk finds them, writes the note, and holds it
            until you approve.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13.5px] font-medium text-neutral-950"
            >
              Open the desk
              <IconArrowRight size={15} />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center rounded-full px-4 py-2.5 text-[13.5px] text-white ring-1 ring-white/35"
            >
              See how a yes happens
            </a>
          </div>
        </div>
        <div>
          <Tilt disabled={Boolean(reduce)}>
            <ProductStage live paper />
          </Tilt>
          <p className="mt-3 text-[12px] text-white/60">Sample chat. Nothing leaves until you approve.</p>
        </div>
      </div>
    </section>
  );
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
        <p className="text-[12px] text-muted-foreground">Replies, sample week</p>
        <p className="text-[12px] tabular-nums text-muted-foreground">
          {hot === null ? "20" : WEEK[hot]?.[1]} replies
        </p>
      </div>
      <div className="relative mt-4 h-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between">
          {[0, 1, 2].map((line) => (
            <span key={line} className="border-t border-border/80" />
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
                transition={{ duration: 0.55, delay: index * 0.05, ease: [0.22, 0.61, 0.36, 1] }}
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

function LogoPill({ id, name }: { id: string; name: string }) {
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full bg-card px-3 text-[13px] ring-1 ring-border">
      <img src={`/brand/logos/${id}.svg`} alt="" className="size-4 object-contain" />
      {name}
    </span>
  );
}

function Tilt({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (event: React.PointerEvent) => {
    if (disabled || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg)`;
  };
  return (
    <div className="[perspective:1200px]" onPointerMove={onMove} onPointerLeave={() => {
      if (ref.current) ref.current.style.transform = "";
    }}>
      <div ref={ref} className="transition-transform duration-200 ease-out">
        {children}
      </div>
    </div>
  );
}

function Reveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
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
  phase: StagePhase;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onEnter(index);
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [index, onEnter]);

  return (
    <div
      ref={ref}
      className={`flex flex-col justify-center border-t border-border py-10 pl-4 transition-opacity md:min-h-[88vh] md:py-0 ${
        active ? "border-l-2 border-l-primary opacity-100" : "border-l-2 border-l-transparent opacity-45"
      }`}
    >
      <div className="text-[12px] text-muted-foreground tabular-nums">{n}</div>
      <h3 className="mt-2 max-w-[12ch] text-[34px]/[1.05] font-medium tracking-tight md:text-[52px]/[1.02]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-[13.5px]/5 text-muted-foreground">{body}</p>
      <div className="mt-4 md:hidden">
        <ProductStage phase={phase} compact />
      </div>
    </div>
  );
}

function CapabilityVisual({ id }: { id: string }) {
  if (id === "qualify") {
    return (
      <div className="flex flex-col justify-center gap-3">
        {[
          ["ICP fit", 92],
          ["Timing", 74],
          ["Duplicate", 12],
        ].map(([label, value]) => (
          <div key={String(label)} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-[12.5px]">
            <span>{label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-accent">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
            </span>
            <span className="tabular-nums text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
    );
  }
  if (id === "write") {
    return (
      <div className="space-y-2 text-[12.5px]">
        {[
          ["Day 0", "A quieter way to fill Thursday"],
          ["Day 3", "The waitlist number, if it’s useful"],
          ["Day 7", "A short note, not a pitch"],
        ].map(([day, line]) => (
          <div key={day} className="flex gap-3 rounded-lg bg-background px-3 py-2 ring-1 ring-border">
            <span className="w-10 shrink-0 text-muted-foreground">{day}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    );
  }
  if (id === "approve") {
    return (
      <div className="flex h-full flex-col justify-center">
        <p className="text-[13px]">A quieter way to fill Thursday’s clinics</p>
        <p className="mt-2 text-[12.5px]/5 text-muted-foreground">
          Amaka — the Ikeja site still shows an 11-day wait.
        </p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground">
            Approve
          </span>
          <span className="rounded-full px-3 py-1.5 text-[12.5px] ring-1 ring-border">Hold</span>
        </div>
      </div>
    );
  }
  if (id === "track") {
    return (
      <div className="grid grid-cols-4 gap-2 text-center text-[12px]">
        {[
          ["48", "Found"],
          ["11", "Fit"],
          ["4", "Drafts"],
          ["1", "Meeting"],
        ].map(([n, label]) => (
          <div key={label} className="rounded-xl bg-background px-2 py-4 ring-1 ring-border">
            <div className="text-[20px] font-medium tabular-nums">{n}</div>
            <div className="mt-1 text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-background px-3 py-2 text-[12.5px] text-muted-foreground ring-1 ring-border">
        Clinic groups in Lagos that still book by hand
      </div>
      {["Amaka Adeyemi · Halcyon", "Jonah Ellis · Fieldnote", "Priya Raman · Northspan"].map(
        (row) => (
          <div key={row} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-[12.5px] ring-1 ring-border">
            <span className="truncate">{row}</span>
            <span className="text-[11px] text-muted-foreground">new</span>
          </div>
        ),
      )}
    </div>
  );
}

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
      const t = Math.min(1, (now - start) / 800);
      const eased = 1 - (1 - t) ** 3;
      setN(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, run, value]);
  return <>{n}</>;
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left text-[14px] font-medium"
      >
        {q}
        <span className="text-muted-foreground">{open ? "–" : "+"}</span>
      </button>
      {open ? <p className="mt-1.5 text-[13px]/5 text-muted-foreground">{a}</p> : null}
    </div>
  );
}
