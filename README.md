# Ọru

A chat-first AI sales desk. You describe who to reach. Ọru finds and scores prospects, writes a sequence, and queues email until you approve it.

Ọru combines chat, streaming, living artifacts, research, integrations, and specialist agents in one opportunity-intelligence workspace. The repository retains the licenses of its open-source foundations.

## Run it

Requires [Bun](https://bun.sh).

```bash
bun install
cp apps/web/.env.example apps/web/.env.local
cp packages/backend/.env.example packages/backend/.env.local
```

Fill in the real Convex, Better Auth, Google OAuth, OpenRouter, and Composio values before starting the app.

```bash
bun run --cwd apps/web dev
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

Set the deployment URL and site URL (`*.convex.site`) in `apps/web/.env.local`, then sign in with Google. New workspaces begin empty and populate only from real user actions and connected providers.

## Environment

| | |
| --- | --- |
| `apps/web/.env.example` | Next.js: Convex URLs, site URL, Google client |
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
bun run --cwd apps/web lint
bun run --cwd apps/web build
```

## Required services

Google OAuth, `BETTER_AUTH_SECRET`, Convex, OpenRouter, and Composio must be configured. `apps/web` is the production application.
