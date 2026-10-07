import type { Id } from "@whirl/backend/convex/_generated/dataModel";
import type { StoreIntegration } from "@/lib/integrations-data";
import type { StoreSkill } from "@/lib/skills-data";
import type { ThreadSummary } from "@/lib/threads";
import type { ChatMessage } from "@/lib/messages";

const asIntegration = (id: string) => id as Id<"integrations">;
const asServer = (id: string) => id as Id<"mcpServers">;
const asSkill = (id: string) => id as Id<"skills">;
const asThread = (id: string) => id as Id<"threads">;

export type DemoProspect = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  location: string;
  score: number;
  fit: "Strong" | "Possible" | "Weak";
  list: string;
  status: "New" | "Qualified" | "Sequenced" | "Replied";
};

export const DEMO_PROSPECTS: DemoProspect[] = [
  {
    id: "p1",
    name: "Amaka Nwosu",
    title: "VP Revenue",
    company: "Halcyon Clinics",
    email: "amaka@halcyonclinics.example",
    location: "Lagos",
    score: 92,
    fit: "Strong",
    list: "Clinic groups, West Africa",
    status: "Qualified",
  },
  {
    id: "p2",
    name: "Jonah Adler",
    title: "Head of Growth",
    company: "Brightline Payments",
    email: "jonah@brightlinepay.example",
    location: "London",
    score: 88,
    fit: "Strong",
    list: "Series B fintech",
    status: "Sequenced",
  },
  {
    id: "p3",
    name: "Priya Raman",
    title: "Director of Sales",
    company: "Northwind Logistics",
    email: "priya@northwind.example",
    location: "Nairobi",
    score: 81,
    fit: "Strong",
    list: "Clinic groups, West Africa",
    status: "New",
  },
  {
    id: "p4",
    name: "Elena Voss",
    title: "CRO",
    company: "Fieldnote",
    email: "elena@fieldnote.example",
    location: "Berlin",
    score: 74,
    fit: "Possible",
    list: "Series B fintech",
    status: "Replied",
  },
  {
    id: "p5",
    name: "Mateo Ruiz",
    title: "Founder",
    company: "Cinder Supply",
    email: "mateo@cindersupply.example",
    location: "Mexico City",
    score: 63,
    fit: "Possible",
    list: "Operators, 20–80 people",
    status: "New",
  },
  {
    id: "p6",
    name: "Hannah Cho",
    title: "Sales Manager",
    company: "Lumen Freight",
    email: "hannah@lumenfreight.example",
    location: "Singapore",
    score: 41,
    fit: "Weak",
    list: "Operators, 20–80 people",
    status: "New",
  },
];

export const DEMO_LISTS = [
  { id: "l1", name: "Clinic groups, West Africa", count: 48, updated: "Today" },
  { id: "l2", name: "Series B fintech", count: 36, updated: "Yesterday" },
  { id: "l3", name: "Operators, 20–80 people", count: 22, updated: "Mon" },
];

export const DEMO_APPROVALS = [
  {
    id: "a1",
    to: "Amaka Nwosu",
    company: "Halcyon Clinics",
    subject: "A quieter way to fill Thursday’s clinics",
    preview:
      "Amaka — Halcyon’s Ikeja site still shows a 11-day wait for new patients. We book the first consult before your coordinators open the spreadsheet.",
    step: "1 of 4",
    sequence: "Clinic revival",
  },
  {
    id: "a2",
    to: "Jonah Adler",
    company: "Brightline Payments",
    subject: "Your EU expansion, without another SDR",
    preview:
      "Jonah — Brightline’s careers page has been hiring two SDRs since March. This sequence talks to the finance leads they would have dialed.",
    step: "2 of 4",
    sequence: "Fintech outbound",
  },
];

export const DEMO_TASKS = [
  { id: "t1", title: "Approve Halcyon step 1", when: "Today · 9:30", kind: "Approval" },
  { id: "t2", title: "Review replies from Fieldnote", when: "Today · 11:00", kind: "Reply" },
  { id: "t3", title: "Rebuild the fintech ICP", when: "Tomorrow", kind: "Research" },
  { id: "t4", title: "Weekly pipeline note", when: "Fri · recurring", kind: "Report" },
];

export const DEMO_CAMPAIGNS = [
  { name: "Clinic revival", sent: 186, replies: 24, meetings: 7, status: "Running" },
  { name: "Fintech outbound", sent: 94, replies: 11, meetings: 3, status: "Running" },
  { name: "Operator warm-up", sent: 40, replies: 2, meetings: 0, status: "Draft" },
];

export const DEMO_BARS = [18, 24, 16, 32, 28, 12, 20];

export const DEMO_PIPELINE = [
  { stage: "Found", count: 106, rate: "100%" },
  { stage: "Qualified", count: 41, rate: "39%" },
  { stage: "Sequenced", count: 27, rate: "66%" },
  { stage: "Replied", count: 9, rate: "33%" },
  { stage: "Meeting", count: 4, rate: "44%" },
];

export const DEMO_THREADS: ThreadSummary[] = [
  {
    id: asThread("demo-reach"),
    title: "Clinic groups that still book by hand",
    titleStatus: "ready",
    createdAt: Date.now() - 1000 * 60 * 40,
    updatedAt: Date.now() - 1000 * 20,
    pinnedAt: null,
    model: "Basic",
    compactionStatus: "idle",
    compactionBoundary: null,
    compactionUpdatedAt: null,
    compactionMarkers: [],
    shareId: null,
    locked: false,
    lockedTitle: null,
    folderId: null,
    branchedFromThreadId: null,
  },
  {
    id: asThread("demo-list"),
    title: "Series B fintech, London and Berlin",
    titleStatus: "ready",
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    pinnedAt: null,
    model: "Basic",
    compactionStatus: "idle",
    compactionBoundary: null,
    compactionUpdatedAt: null,
    compactionMarkers: [],
    shareId: null,
    locked: false,
    lockedTitle: null,
    folderId: null,
    branchedFromThreadId: null,
  },
];

const prospectPayload = JSON.stringify({
  title: "Clinic groups, West Africa",
  rows: DEMO_PROSPECTS.filter((row) => row.list.startsWith("Clinic")).map((row) => ({
    name: row.name,
    title: row.title,
    company: row.company,
    score: row.score,
    fit: row.fit,
  })),
});

const sequencePayload = JSON.stringify({
  name: "Clinic revival",
  steps: [
    { day: 0, channel: "Email", subject: "A quieter way to fill Thursday’s clinics" },
    { day: 3, channel: "Email", subject: "The waitlist number, if it’s useful" },
    { day: 7, channel: "LinkedIn", subject: "A short note, not a pitch" },
    { day: 12, channel: "Email", subject: "I’ll leave this here" },
  ],
});

const approvalPayload = JSON.stringify(DEMO_APPROVALS[0]);

export function demoMessages(threadId: string): ChatMessage[] {
  const now = Date.now();
  if (threadId === "demo-list") {
    return [
      {
        id: "u-list",
        role: "user",
        content: "Build a list of Series B fintech heads of growth in London and Berlin. Score them.",
        createdAt: now - 60_000,
        status: "complete",
      },
      {
        id: "a-list",
        role: "assistant",
        content:
          "36 people match. I kept anyone under 60 off the list. Brightline and Fieldnote are the two I’d write first.",
        createdAt: now - 40_000,
        status: "complete",
        phases: [
          {
            kind: "lead",
            title: "Series B fintech",
            text: JSON.stringify({
              title: "Series B fintech",
              rows: DEMO_PROSPECTS.filter((row) => row.list === "Series B fintech").map(
                (row) => ({
                  name: row.name,
                  title: row.title,
                  company: row.company,
                  score: row.score,
                  fit: row.fit,
                }),
              ),
            }),
          },
        ],
      },
    ];
  }

  return [
    {
      id: "u-reach",
      role: "user",
      content:
        "Find clinic groups in West Africa that still book new patients by hand. Qualify them, then draft the first email for the strongest one.",
      createdAt: now - 25_000,
      status: "complete",
    },
    {
      id: "a-reach",
      role: "assistant",
      content: "Amaka at Halcyon is the one I’d send. The draft is waiting for you — nothing leaves until you approve it.",
      createdAt: now - 4_000,
      status: "streaming",
      phases: [
        { kind: "lead", title: "Finding prospects", text: prospectPayload },
        { kind: "lead", title: "Sequence", text: sequencePayload, name: "sequence" },
        { kind: "lead", title: "Draft for approval", text: approvalPayload, name: "approval" },
        {
          kind: "chart",
          title: "Replies",
          chart: {
            type: "bar",
            title: "Replies this week",
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            series: [{ name: "Replies", values: [2, 4, 3, 6, 5] }],
          },
        },
      ],
    },
  ];
}

type ListingInput = {
  id: string;
  name: string;
  description: string;
  category: string;
  tools: number;
};

function listing(row: ListingInput): StoreIntegration {
  return {
    id: asIntegration(row.id),
    name: row.name,
    description: row.description,
    author: "Composio",
    category: row.category,
    verified: true,
    logoUrl: `/brand/logos/${row.id}.svg`,
    bannerUrl: null,
    authMode: "oauth",
    authFields: [],
    toolCount: row.tools,
    composioConnect: true,
    installedServerId: row.id === "gmail" ? asServer("srv-gmail") : null,
    installedConnected: row.id === "gmail",
  };
}

const CATALOG: ListingInput[] = [
  { id: "hubspot", name: "HubSpot", description: "Pipeline, contacts, and the deals already in motion.", category: "CRM", tools: 42 },
  { id: "salesforce", name: "Salesforce", description: "Read and update opportunities from the thread.", category: "CRM", tools: 38 },
  { id: "pipedrive", name: "Pipedrive", description: "A pipeline for teams that live in stages.", category: "CRM", tools: 24 },
  { id: "attio", name: "Attio", description: "A CRM for teams that outgrew the spreadsheet.", category: "CRM", tools: 18 },
  { id: "gmail", name: "Gmail", description: "Queue and send the emails you already approved.", category: "Email", tools: 16 },
  { id: "outlook", name: "Outlook", description: "Microsoft mail for teams still in the office suite.", category: "Email", tools: 14 },
  { id: "googlecalendar", name: "Google Calendar", description: "Book the meeting once someone says yes.", category: "Calendar", tools: 12 },
  { id: "calendly", name: "Calendly", description: "A real booking link, not another thread.", category: "Calendar", tools: 8 },
  { id: "apollo", name: "Apollo", description: "Turn a name into a title, company, and email.", category: "LinkedIn & enrichment", tools: 20 },
  { id: "linkedin", name: "LinkedIn", description: "Pull the public profile in before you write.", category: "LinkedIn & enrichment", tools: 9 },
  { id: "hunter", name: "Hunter", description: "Check the address exists before it sends.", category: "LinkedIn & enrichment", tools: 6 },
  { id: "slack", name: "Slack", description: "Tell the team when a reply needs a person.", category: "Communication", tools: 15 },
  { id: "googlesheets", name: "Google Sheets", description: "Keep a list where the company already looks.", category: "Data", tools: 11 },
  { id: "notion", name: "Notion", description: "File the brief, the ICP, and the call notes.", category: "Docs", tools: 13 },
  { id: "googledocs", name: "Google Docs", description: "Write the longer sequence where people comment.", category: "Docs", tools: 7 },
];

export const DEMO_INTEGRATIONS: StoreIntegration[] = CATALOG.map(listing);

export const DEMO_SKILLS: StoreSkill[] = [
  {
    id: asSkill("skill-icp"),
    name: "ICP writer",
    description: "Turn a rough market into a list the agent can actually search.",
    author: "Oso-Ahia",
    category: "Research",
    verified: true,
    logoUrl: null,
    bannerUrl: null,
    installed: true,
  },
  {
    id: asSkill("skill-voice"),
    name: "Founder voice",
    description: "Short emails. No ‘just circling back’. No fake familiarity.",
    author: "Oso-Ahia",
    category: "Writing",
    verified: true,
    logoUrl: null,
    bannerUrl: null,
    installed: true,
  },
  {
    id: asSkill("skill-judge"),
    name: "Qualify before write",
    description: "Jev scores fit, intent, and duplicates before a draft is made.",
    author: "Oso-Ahia",
    category: "Research",
    verified: true,
    logoUrl: null,
    bannerUrl: null,
    installed: false,
  },
];
