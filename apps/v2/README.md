# Whirl web app

The production Oso-Ahia Next.js app. It talks to the Convex backend in
[`packages/backend`](../../packages/backend) and signs people in with Better Auth.

## Running it

Set up the backend and real environment values first. Then:

```sh
cp .env.example .env.local   # fill in Convex + Google OAuth
bun run dev                  # http://localhost:3000
```

`bun run dev` also rebuilds the artifact runtime (`public/artifact-runtime.js`),
the bundle sandboxed React artifacts run on.

## Layout

| Path            | What's there                                                   |
| --------------- | -------------------------------------------------------------- |
| `app/`          | Routes. `(shell)` is the chat app; `about`, `pricing`, and `share` are public pages |
| `components/`   | UI, grouped by feature (`thread/`, `settings/`, `integrations/`, ...) |
| `components/ui` | Shared primitives: dialogs, buttons, menus                     |
| `lib/`          | Hooks, caches, and helpers; `lib/site.ts` holds the instance's name and links |
| `public/`       | Static assets, fonts, and the service worker                   |
| `scripts/`      | Build helpers and screenshot tooling                           |

## Checks

```sh
bunx tsc --noEmit
bun run lint
```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for conventions.
