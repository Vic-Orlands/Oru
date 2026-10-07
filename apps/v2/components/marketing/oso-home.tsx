"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCircleCheckFilled,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { motion } from "motion/react";

import { OsoLogo } from "@/components/oso-logo";
import { useIsDark, useTheme } from "@/lib/theme";

const STEPS = [
  {
    n: "01",
    title: "Describe the room",
    body: "An ICP in a sentence. City, size, the job title that actually feels the problem.",
  },
  {
    n: "02",
    title: "The desk does the dull work",
    body: "It finds people, scores them with a fast judge, and writes a sequence in your voice.",
  },
  {
    n: "03",
    title: "You approve the send",
    body: "Nothing leaves the building until you say yes. Meetings land on the calendar you already use.",
  },
];

const CAPABILITIES = [
  ["Find", "Prospects from a description, not a filter maze."],
  ["Qualify", "A yes/no judge for fit, intent, and duplicates."],
  ["Write", "Multi-step sequences that sound like a person."],
  ["Approve", "Every email waits in a card you can hold."],
  ["Send", "Gmail, Outlook, and the calendar, through Composio."],
  ["Track", "Replies, meetings, and the funnel between them."],
];

const TOOLS = [
  "Gmail",
  "Outlook",
  "Google Calendar",
  "HubSpot",
  "Salesforce",
  "Pipedrive",
  "Apollo",
  "LinkedIn",
  "Slack",
  "Sheets",
];

const FAQ = [
  [
    "Does it send email on its own?",
    "No. Drafts queue for approval. You can hold a step, edit it, or let the sequence continue.",
  ],
  [
    "Which model writes?",
    "Kimi K2, through OpenRouter. Fast yes/no calls — fit, intent, duplicates — go to Jev, with a cheap structured model behind it if Jev is quiet.",
  ],
  [
    "What do I connect?",
    "The integrations page is Composio plus any MCP server you already trust. Gmail and a calendar are enough to start.",
  ],
  [
    "Can I look around without keys?",
    "Yes. Demo mode signs you in as a sample workspace so the desk, the lists, and a mid-stream chat are already there.",
  ],
];

export function OsoHome() {
  const { setTheme } = useTheme();
  const dark = useIsDark();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-[14px] font-medium">
          <OsoLogo size={18} />
          Oso-Ahia
        </Link>
        <nav className="ml-6 hidden items-center gap-5 text-[13px] text-muted-foreground md:flex">
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
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
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
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 pb-16 md:grid-cols-[1fr_1.1fr] md:pt-16">
          <div>
            <p className="text-[12px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Sales lead desk
            </p>
            <h1 className="mt-3 max-w-[16ch] text-[40px]/[1.05] font-medium tracking-tight md:text-[52px]/[1.02]">
              Find the room. Wait for the yes.
            </h1>
            <p className="mt-4 max-w-md text-[15px]/6 text-muted-foreground">
              Oso-Ahia is a chat for outbound. You describe who should hear from you.
              The desk finds them, writes the sequence, and holds every send until you approve it.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13.5px] font-medium text-primary-foreground"
              >
                Look around
                <IconArrowRight size={15} />
              </Link>
              <a href="#how" className="text-[13.5px] text-muted-foreground">
                See how it works
              </a>
            </div>
          </div>
          <ProductFrame />
        </section>

        <section id="how" className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
              >
                <div className="text-[12px] text-muted-foreground">{step.n}</div>
                <h2 className="mt-2 text-[18px] font-medium tracking-tight">{step.title}</h2>
                <p className="mt-2 text-[13.5px]/5 text-muted-foreground">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="capabilities" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-[28px] font-medium tracking-tight">What the chat can do</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map(([title, body]) => (
                <div key={title} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                  <div className="text-[14px] font-medium">{title}</div>
                  <p className="mt-1.5 text-[13px]/5 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <div className="text-[12px] tracking-[0.14em] text-muted-foreground uppercase">
              Connect what you already use
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {TOOLS.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-card px-3 py-1 text-[12.5px] ring-1 ring-border"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2">
            <div>
              <h2 className="text-[28px] font-medium tracking-tight">Approval is the product</h2>
              <p className="mt-3 max-w-md text-[14px]/6 text-muted-foreground">
                The agent can queue mail, book a meeting, and update the CRM. It cannot skip you.
                A draft is a card. Approve it, hold it, or rewrite the line that sounds wrong.
              </p>
            </div>
            <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
              <div className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Needs your yes
              </div>
              <div className="mt-1 text-[14px] font-medium">
                A quieter way to fill Thursday’s clinics
              </div>
              <p className="mt-2 text-[13px]/5 text-muted-foreground">
                Amaka — Halcyon’s Ikeja site still shows an 11-day wait. We book the first consult
                before your coordinators open the spreadsheet.
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium">
                <IconCircleCheckFilled size={14} />
                Approve and queue
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-[28px] font-medium tracking-tight">Pricing</h2>
            <p className="mt-2 max-w-lg text-[13.5px] text-muted-foreground">
              A placeholder while the desk is in private use. Seats, not surprise overages.
            </p>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                ["Desk", "For one person who writes their own outbound.", "Soon"],
                ["Team", "Shared lists, shared approvals, one voice.", "Soon"],
                ["House", "Your CRM, your domain, your rules.", "Talk to us"],
              ].map(([name, body, price]) => (
                <div key={name} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                  <div className="text-[14px] font-medium">{name}</div>
                  <p className="mt-1.5 text-[13px]/5 text-muted-foreground">{body}</p>
                  <div className="mt-4 text-[13px]">{price}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-border">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <h2 className="text-[28px] font-medium tracking-tight">Questions</h2>
            <div className="mt-6 divide-y divide-border">
              {FAQ.map(([q, a]) => (
                <Faq key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border">
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
      </main>

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

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className="block w-full py-3 text-left"
    >
      <div className="text-[14px] font-medium">{q}</div>
      {open && <p className="mt-1.5 text-[13px]/5 text-muted-foreground">{a}</p>}
    </button>
  );
}

function ProductFrame() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border"
    >
      <div className="relative h-36">
        <img src="/brand/hero-loft.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        <div className="absolute inset-x-0 bottom-3 text-center text-[15px] font-medium text-white">
          Who should we reach today?
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-xl bg-background p-3 ring-1 ring-border">
          <div className="text-[11px] text-muted-foreground">New chat</div>
          <div className="mt-1 text-[13px]">
            Clinic groups in Lagos that still book by hand
            <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-foreground align-middle" />
          </div>
          <div className="mt-2 flex gap-1.5 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-accent px-2 py-0.5">Kimi</span>
            <span className="rounded-full bg-accent px-2 py-0.5">Gmail</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-xl bg-background p-2.5 ring-1 ring-border">
            <div className="text-[11px] text-muted-foreground">Working now</div>
            <div className="mt-1 font-medium">Qualifying Halcyon</div>
          </div>
          <div className="rounded-xl bg-background p-2.5 ring-1 ring-border">
            <div className="text-[11px] text-muted-foreground">Approvals</div>
            <div className="mt-1 font-medium">2 drafts waiting</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
