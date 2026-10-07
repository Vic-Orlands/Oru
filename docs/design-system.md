# Design system

Oso-Ahia uses one token set. Pages do not invent colors, radii, or type sizes.

The UI is built from bits-ui (the same primitives shadcn-svelte uses) plus tailwind-variants. `components.json` records the shadcn-svelte aliases. The official CLI was not used to generate the components, because this app is on SvelteKit 3 and the published registry still targets Kit 2. Button, badge, dialog, and command follow that pattern and read only these tokens.

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#f3f2ee` | `#101210` | App canvas |
| `--foreground` | `#1c1d1a` | `#eceae3` | Text |
| `--card` | `#fbfbf8` | `#171917` | Surfaces |
| `--muted` | `#e8e6df` | `#232623` | Fills, selected nav |
| `--muted-foreground` | `#5e615b` | `#a3a69e` | Secondary text |
| `--border` | `#dddacf` | `#2e332e` | Hairlines |
| `--accent` | `#0e6b52` | `#3dbe8b` | Primary action, fit |
| `--accent-foreground` | `#f4fbf7` | `#06281b` | Text on accent |
| `--warning` | `#8a5a00` | `#e2b15a` | Pending |
| `--danger` | `#9f2d32` | `#f0a3a6` | Reject, archive |
| `--ring` | accent | accent | Focus |

Neutrals are warm paper, not pure gray. The green is a market stamp, used for the primary button, fit badges, and the funnel bar.

## Type

Geist Sans and Geist Mono, variable. The root font size stays 16px so spacing in rem stays predictable. Body copy is 13px (`--text-base`). Labels and meta are 11–12px. Page titles are 22px, weight 500, tight tracking. Numbers use Geist Mono and tabular figures (`.num`).

## Space, radius, elevation

Spacing follows Tailwind’s scale, mostly 4, 8, 12, 16, and 20px inside the app. Radius is 6 / 8 / 12px (`--radius-sm/md/lg`). Cards are flat: a 1px border, no shadow. The command palette and the lead drawer are the only elevated surfaces (`0 16px 50px` at 16% black).

## Motion

Duration 150–220ms. Easing `--ease-out-soft` is `cubic-bezier(0.2, 0.8, 0.2, 1)`.

- Route changes fade in 160ms (`svelte/transition`).
- The landing hero uses Motion’s `animate()` because the `motion` package has no Svelte entry. The sign-in card uses `fly`.
- Skeletons use a 1.1s shimmer. They mean “waiting on the model”, not decoration.
- No bounce, no page-load choreography inside the desk.

## Components

Button variants: primary, secondary, ghost, danger. Badge tones: neutral, good, warn, bad. Empty states are a dashed card with one sentence and one action. Tables are hairline grids, left aligned, with the score in mono.

Light and dark are the `dark` class on `html`, stored in `localStorage` under `oso-theme`, with a first-paint script in `app.html` so the theme does not flash.
