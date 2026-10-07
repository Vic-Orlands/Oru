# Oso-Ahia

A chat-first AI sales desk. You describe who to reach. Oso-Ahia finds and scores prospects, writes a sequence, and queues email until you approve it.

The chat, streaming, artifacts, and motion come from [Whirl](https://github.com/whirlchat/whirl) by [Anterra](https://whirl.chat), published under the MIT license. This repository keeps that license. The product on top — prospects, approvals, sequences, pipeline, and the desk — is Oso-Ahia.

## Run it

Requires [Bun](https://bun.sh).

```bash
bun install
cp apps/v2/.env.example apps/v2/.env.local
cp packages/backend/.env.example packages/backend/.env.local
```

Demo mode is on when `NEXT_PUBLIC_DEMO_MODE=true` (the example file). No Convex, Google, OpenRouter, or Composio keys are required. The desk, a mid-stream chat, and the integrations catalog are fixtures.

```bash
bun run --cwd apps/v2 dev
```

Open http://localhost:3000 for the marketing site and http://localhost:3000/app for the desk.

## Convex, when you have keys

Use `bunx convex dev` while building. Do not use `bunx convex deploy` except for production.

```bash
# packages/backend/.env.local
CONVEX_AGENT_MODE=anonymous   # cloud agents only; skip this on your own machine

cd packages/backend
bunx convex dev
```

Set the deployment URL and site URL (`*.convex.site`) in `apps/v2/.env.local`, then turn demo mode off:

```
NEXT_PUBLIC_DEMO_MODE=false
```

Sign in with Google, then seed the sample workspace from the Convex dashboard:

```bash
bunx convex run leads:seed
```

## Environment

| | |
| --- | --- |
| `apps/v2/.env.example` | Next.js: demo flag, Convex URLs, site URL, Google client |
| `packages/backend/.env.example` | Convex: better-auth secret, Google, OpenRouter, Kimi + Jev model ids, Composio, MCP |

Chat defaults to `moonshotai/kimi-k2.6` (`OPENROUTER_CHAT_MODEL`). Yes/no checks (fit, intent, duplicates, approval) call OpenRouter's Decisions API with `typesafe/jev-1.13` (`OPENROUTER_JUDGE_MODEL`) and fall back to `OPENROUTER_JUDGE_FALLBACK_MODEL`.

## What the desk does

- Find and enrich a short list from an ICP, scored by the judge
- Save lists, write multi-step sequences, queue drafts for approval
- Send only after approval, through Composio (Gmail, Outlook, Calendar, HubSpot, Salesforce, Pipedrive, Apollo, LinkedIn, Slack, Sheets) plus any MCP server
- Tasks, pipeline conversion, and a weekly performance chart
- Integrations live at `/integrations`, not inside settings

## Checks

```bash
bun run --cwd packages/backend typecheck
bun run --cwd apps/v2 lint
bun run --cwd apps/v2 build
```

## Still needs real keys

Google OAuth, `BETTER_AUTH_SECRET`, OpenRouter, and Composio. Without them, demo mode is the way through the product. Legacy, mobile, and console apps from the Whirl tree are not the product and still mention Clerk; `apps/v2` does not.
