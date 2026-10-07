# Models

Both roles are configurable. Workspace settings can override the ids. Environment variables are the defaults.

## Chat: `moonshotai/kimi-k2.5`

The brief asked for Moonshot Kimi K2, latest, on OpenRouter, for streaming chat, tool calls, outreach copy, and research summaries.

OpenRouter also lists `moonshotai/kimi-k2.6` (about $0.95 / $4 per million tokens) and a coding-specialized K2.7 that spends tokens on hidden reasoning. Kimi K3 exists and is a different, more expensive family (about $3 / $15). K2.5 is the K2 model that stays cheap enough for multi-step tool calls while still writing a short, specific email. Public list price is about **$0.45 / $2.25 per million** input / output tokens.

Set `OPENROUTER_CHAT_MODEL=moonshotai/kimi-k2.6` if you want the newer general K2 and accept the higher price. K3 is the wrong default for this desk: the work is tool use and short copy, not a frontier coding agent.

## Judge: `typesafe/jev-1.13`

“Jev” is a real OpenRouter model family, `typesafe/jev-1.13`. It is not a chat-completions model. It is served by the Decisions API (`POST https://openrouter.ai/api/alpha/decisions`) and answers `noul` (probability of yes), `choice`, and `score` questions. List price is about **$0.042 per million input tokens and $0 output**, with responses around a fifth of a second. That is the right shape for ICP fit, reply intent, and duplicate checks.

We send ICP fit as a `noul` question and treat probability ≥ 0.62 as a fit. The numeric score shown in the table is that probability scaled to 0–100.

The OpenRouter Decider V1 is a close alternative at about $0.04 per million and slower (about 0.3s). Jev is the one the product asked for, and it is the faster of the two.

## Fallback

If the Decisions API errors and `OPENROUTER_API_KEY` is set, the judge retries with `generateObject` (Zod) on `OPENROUTER_JUDGE_FALLBACK_MODEL`, default `google/gemini-2.5-flash-lite`. That model is a cheap structured-output chat model, which is what `generateObject` needs. Jev itself cannot be called through `generateObject`.

If that call also fails, or there is no key, or `DEMO_MODE` leaves the agent in demo because the key is empty, scoring uses a deterministic ICP heuristic in `@oso-ahia/domain`. The UI labels the source so a demo score is not presented as a model verdict.

## When the key is missing

`OPENROUTER_API_KEY` empty means demo AI: the chat router is keyword-based, the first tokens still stream, and the same tools write real rows. Settings says so.
