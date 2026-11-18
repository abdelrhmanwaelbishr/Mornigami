# AGENTS.md — Mornigami

Instructions for every agent that works in this repository, whatever the tool (DSH, Claude Code, Codex, OpenCode, Antigravity, agy).

## Before you start any task

Read **[PROJECT-HISTORY.md](PROJECT-HISTORY.md)**. It is the long memory of this project: every session, the decisions and the reasons behind them, the discoveries and the dead ends, and what is still open. Start there instead of re-deriving the codebase from scratch — it will save you a session and stop you from re-litigating decisions that were already made.

Then read whatever the task actually touches:

- **[HANDOFF.md](HANDOFF.md)** — current state and every open finding, tagged FIXED / PARTIAL / OPEN with `file:line`. Read this before you fix anything.
- **[DESIGN.md](DESIGN.md)** — the visual contract. Read this before you touch UI.
- **[PRODUCT.md](PRODUCT.md)** — what the product is for, who it serves, what must not change.
- **[UI-ROADMAP.md](UI-ROADMAP.md)** — the phases and their exit tests. Read this before starting new design work.

## When your task is done

Update **[PROJECT-HISTORY.md](PROJECT-HISTORY.md)**. That is part of the task, not an optional extra. Follow the **How to update this file** protocol at the top of that file: append a dated section with the whole session's context — the goal, decisions with the reason that decided them, what shipped (commit hashes), what you verified and how, what you did *not* check, dead ends, what remains, and the risks the next agent must know. A one-line status is not an update.

Then bring **[HANDOFF.md](HANDOFF.md)** in line: move any finding you closed to FIXED, mark partial work PARTIAL, and leave its next-action list pointing at what is genuinely next.

Never rewrite or delete an earlier history section. Correct it with a dated note.

## Ground rules for this repo

- **The smallest complete change wins.** No new abstraction, wrapper or dependency for a job the codebase already has a way to do.
- **Design follows `DESIGN.md`, not taste.** Ink type, white sheets on hairline borders, Fraunces numerals, one accent reserved for button fills. If a brief wants something the tokens forbid (cream paper, a second display face, gradient text), ask the owner before shipping it.
- **Verify by looking.** Both themes, at 390 / 768 / ~1280, on the real page — not only in the diff. State plainly what you did not check.
- **Never commit secrets.** Credentials in this repo's history are redacted on purpose; do not re-add them.
- **Push only when asked.** The owner reviews before anything leaves the machine.
