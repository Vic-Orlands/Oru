# Oso-Ahia

A human-in-the-loop sales desk. The agent finds leads and drafts outreach. Nothing is sent until someone on the workspace approves it.

The name is Igbo: *oso ahịa*, the rush of a market. The seeded workspace is Ahịa Studio, owned by Chimezie.

## Architecture

```
apps/web        SvelteKit 3, Svelte 5, Tailwind 4. The product and the HTTP API.
apps/worker     Polls sequence steps and recurring tasks.
packages/domain Pure rules: ICP score, dedupe, funnel, sequence, CSV, agent routing.
packages/db     Drizzle schema, queries, migrations, seed.
packages/ai     Jev judge, generateObject fallback, agent instructions.
packages/integrations  Composio toolkit catalog and REST client.
packages/jobs   One tick of the sequence engine and the task clock.
```

Postgres is the source of truth. better-auth owns `user`, `session`, `account`, and `verification`. Everything else is scoped by `workspace_id`. A member row is claimed on first visit to `/app` by matching the sign-in email, which is how the seeded owner becomes Chimezie’s account.

The chat route streams UI message parts. In demo mode (no `OPENROUTER_API_KEY`) a small router picks a tool and writes tokens before the database work. With a key, `streamText` calls Kimi through OpenRouter and the same tool functions run. Approvals are the only path to Gmail.

## Setup

```bash
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The web app is http://localhost:5173. The worker starts with `pnpm dev` as well and ticks every `WORKER_INTERVAL_MS` (default 30s). `POST /api/cron` with header `x-cron-secret` runs the same tick if you would rather schedule it outside the process.

Copy `.env.example` to `apps/web/.env` (and the repo root, which Drizzle and the worker also read). With `DEMO_MODE=true` and empty provider keys, the landing page offers a demo sign-in:

- email `chimezie@osoahia.dev`
- password `oso-ahia-demo-password`

Google sign-in appears only when both Google client variables are set. The agent and judge stay on the local stand-in until `OPENROUTER_API_KEY` is set. Connect on Settings simulates a toolkit until `COMPOSIO_API_KEY` is set. Set `DEMO_MODE=false` before any real deployment.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Web and worker |
| `pnpm build` | Production build |
| `pnpm check` | `svelte-check` and `tsc` |
| `pnpm lint` | Prettier and ESLint |
| `pnpm test` | Vitest |
| `pnpm --filter @oso-ahia/web test:e2e` | Playwright smoke of the main pages |
| `pnpm db:generate` | Drizzle migration from the schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Replace the Ahịa Studio workspace with sample data |

## Environment

See `.env.example`. Required to boot: `DATABASE_URL` and `BETTER_AUTH_SECRET` (32+ characters). Optional keys: Google, OpenRouter, Composio. Model ids: `OPENROUTER_CHAT_MODEL`, `OPENROUTER_JUDGE_MODEL`, `OPENROUTER_JUDGE_FALLBACK_MODEL`. Reasoning for those defaults is in [docs/models.md](docs/models.md).

`GET /api/v1/leads` expects `Authorization: Bearer <key>`. Keys are created in Settings and stored as a SHA-256 hash. The seeded key prefix is `oso_live_seeded` and the raw demo value is `oso_live_seeded_demo_only_rotate_me`. Rotate it.

## Further reading

- [docs/research.md](docs/research.md) — what we took from other sales desks
- [docs/design-system.md](docs/design-system.md) — tokens
- [docs/models.md](docs/models.md) — Kimi K2.5 and Jev
