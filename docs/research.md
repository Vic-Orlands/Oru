# Research notes

These notes record what we borrowed from current sales platforms and the Vercel AI SDK, and how that shaped Oso-Ahia. Layouts and branding are ours.

## What we looked at

**Apollo** keeps a dense, filterable people table at the center. Lists, score, and “add to sequence” are bulk actions on a selection, not separate products. We kept one lead table with sort, filter, column visibility, pagination, and bulk enroll / list / status.

**Clay** treats enrichment and a fit judgment as a step that happens before anyone writes. We score on import and on agent search, and we dedupe before insert. We did not build a spreadsheet canvas.

**11x (Alice) and Artisan (Ava)** put the agent at the front door and keep a human on the send. The agent is a primary nav item. Drafts become approval cards. The product default is that nothing leaves until a person says so.

**Attio** is the reference for calm type, a record drawer instead of a new page, and a command palette. The drawer opens on the lead row. Command-K jumps between desk surfaces.

**Instantly, Smartlead, and Lemlist** model sequences as a vertical list of steps (email, wait, condition, task), not a node graph. Enrollment status is per person. We copied that shape.

**Outreach** ties tasks, the sequence, and a calendar together. Tasks have due dates, assignees, a list, and a month view. A worker advances waits and recurring tasks.

**Vercel AI SDK** streams text first and renders tool calls as parts on the message. Stop and regenerate are first-class. We persist the UI message list, including tool parts, so a thread reloads with the same cards.

## Decisions that followed

- Approvals are a gate, not a log. Email, CRM, and meeting actions sit in `pending` until approve, then a separate send step. Reject stops the sequence step.
- The funnel uses the furthest stage a deal has reached, so dragging a card backward does not erase conversion history.
- The agent’s first tokens are written before lead inserts or approval rows, including in demo mode where there is no model round-trip.
- Tool results render as the object they created: a small lead table, the draft, the task, or the campaign list.
- Demo mode is explicit (`DEMO_MODE`) so the desk can be clicked through before Google, OpenRouter, and Composio keys exist.
