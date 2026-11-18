# Mornigami — Project History

One file, chronological, for every agent who touches this repo. `HANDOFF.md` is the current-state brief; this is the record of how it got there.

## How to update this file — read before you write

If the owner says **"update the history"**, **"update progress"**, **"update this file"**, or asks you to record what happened, that means: **append a full dated section carrying the whole session's context — not one line of status.** This file exists so that nobody has to replay a chat transcript, so a section must contain what a transcript would have handed them:

- **The goal**, as the owner stated it, in their words where the wording mattered.
- **Decisions and the reason that decided them** — the alternative that lost and why. A decision without its "because" is unusable a week later.
- **What shipped** — commit hashes, plus which files and areas changed.
- **What was verified, and how** — viewport, theme, DOM read, build, test, or the live site; and say plainly what was **not** checked.
- **Discoveries and dead ends** — the bug that changed the plan, the approach that failed and the reason it failed.
- **What remains**, including anything deliberately deferred or skipped, and any question still open with the owner.
- **Risks** a future agent must know before touching the area.

Then: `git log` the new commits, extend the commit ledger in §4, and keep `HANDOFF.md` in sync (that one stays short and tagged FIXED/PARTIAL/OPEN). Never rewrite or delete an earlier section — correct it with a dated note.

- **Repo:** `D:/Programming/Mornigami Files/Mornigami` · branch `main` · `origin` = github.com/abdelrhmanwaelbishr/Mornigami
- **Live:** https://mornigami.vercel.app
- **Stack:** React 18.3 · TypeScript 5.5 · Vite 5.4 · Tailwind 3.4 · Firebase 10.8 (Auth + Firestore, project `bishr-hub`)
- **Docs:** `PRODUCT.md` (what it is) · `DESIGN.md` (the visual contract) · `UI-ROADMAP.md` (phases 0–6) · `HANDOFF.md` (open findings)
- **State as of writing:** clean tree at `4337d32`; `PROJECT-HISTORY.md` and `HANDOFF.md` untracked.

---

## 0. Before this record — inherited baseline

The app was built before any of these sessions: React Router with `/login` public and ten protected routes (`/`, `/habits`, `/todo`, `/pomodoro`, `/finance`, `/store`, `/community`, `/playlist`, `/settings`, `/admin`, plus distraction-free `/standalone/*`), localStorage-first state with a best-effort Firestore mirror, demo seeding on mount, an XP economy (habit +50, task +30, pomodoro +150, video +40, group +200, daily budget +50), a level threshold of `userLevel * 500`, and Sonner/confetti celebrations for store and level-ups. Earlier merges (`ui-opc`, `ui-cdx`, `ui-agn`) had already rebuilt the gamification pages with lucide icons and accessible controls. Docs did not exist; design was inconsistent page to page.

---

## 1. Session 2026-11-18 · morning — `/impeccable init` and the first rebuild

**Goal that arrived:** `/impeccable init`, then "use /impeccable /ui-ux-pro-max /web-design-guidelines to revamp the mornigami dashboard u see after u login".

**Context capture.** Ran `impeccable.cmd context`: no PRODUCT.md, existing visual implementation, no auto design hook, `IMAGE_TOOLS: magick` only. Explored the repo (routes, contexts, types, XP mechanics, Firestore rules, the `legacy/` vanilla implementation) and interviewed the owner, one round, three questions:
- Users: **"Me first, friends second."**
- Promise to protect: **"One morning OS, one XP economy."**
- Fixed: **name, crane logo, origami vocabulary** — nothing else pinned.

Wrote `PRODUCT.md` (positioning, four product principles, exact XP table, four open decisions, and an Evidence-on-Hand section that forbids inventing testimonials or benchmark claims).

**Login theme toggle.** The white/blue sign-in revamp (`9c601e6`) had dropped the toggle the pre-revamp page had. Restored it as a masthead row: wordmark plus a 44×44 `.auth-theme-toggle` using the `login.css` tokens, Sun in dark / Moon in light, `aria-label` "Switch to Light/Dark Mode", 2px focus ring, persisted across reload. Verified at 1280×900 and 390×844 in both themes and on sign-up. Detector surfaced only pre-existing Fraunces `overused-font` findings — disclosed, not hidden.

**The dashboard rebuild.** Rendered the incumbent and listed what was wrong: two competing headlines ("Mornigami Dashboard" + "Good morning! Ready to shape your day?"), a gradient hero, an amber gradient bounties banner with an emoji inside the Claim button, and six identical "Core Workspaces" cards that duplicated the sidebar with no data. Replaced the whole page with a **ledger**: a greeting header with one status sentence, a Today sheet of four measures on hairline seams (habits folded, tasks left, focused minutes, daily budget), a Next-up list of four tasks with 44px ticks and due chips, a Bounties ledger with crease marks and Claim only when met, and a seven-day crease strip. The workspaces grid was deleted on purpose: the sidebar already lists every route and the cards were the page's main defect.

**The defect the rebuild exposed.** Tailwind opacity classes on hex-valued CSS variables compiled to *nothing* — `bg-primary/10`, `divide-border/60`, `hover:bg-warning/90` emitted no rule at all, so ~145 classes across the app were dead and rendered transparent. Discovered because the week bars were invisible while still occupying 64px. Recorded, not yet fixed; `dist` confirmed exactly one `.bg-primary` rule and zero alpha variants.

**Shipped:** `e251e27` login toggle · `1e8b1c1` dashboard as daily ledger · `8b1a046` PRODUCT.md, `.impeccable/config.json`, hook wiring (`.claude` manifest, which never fires under DSH).

---

## 2. Session 2026-11-18 · midday — the roadmap, then Phase 0 and 1

**Goal that arrived:** measure the codebase, write a roadmap, then execute it — with standing permission to delegate to codex/antigravity/opencode.

**`UI-ROADMAP.md`.** Measured 7,997 page lines (Admin 2,055 · Playlists 1,306 · Finance 851 · Todo 755 · Login 640 · Pomodoro 490 · Settings 384 · Habits 336 · Community 304 · Home 299 · Store 295), 36 `Card` usages, and the 108 (later 145) dead opacity classes. Defined the direction "the ledger" with three rules — *a surface is a sheet, not a card*; *numbers are Fraunces `tabular-nums` with 12px DM Sans labels, no third size*; *colour is state, and amber means XP owed* — and seven phases, each with an exit test.

**Phase 0 — foundations.**
- Tokens became **channel triplets** (`--color-primary: 15 23 42`) with Tailwind mapped to `rgb(var(--color-x) / <alpha-value>)`, which switched every opacity class back on. This was two bugs, not one: the stylesheet, *and* `ThemeContext` writing a hex inline via `root.style.setProperty`, which overrode the sheet. Both fixed; the inline writer now removes itself when no accent is set.
- Added `success/warning/danger` **ink** tokens so state text can be legible on white and on black, and `color-scheme` per theme.
- Extracted five primitives — `Sheet`, `SheetHeading`, `Stat`, `Creases`, `TaskTick` — and moved Home onto them with zero visual change.
- Wrote `DESIGN.md` (and later learned the hard lesson that a hex token silently kills opacity classes).
- Built the dev preview harness (`preview.html` + `src/preview.tsx`, `?p=…&theme=…`), deliberately not referenced by `index.html` so it never enters the bundle.
- Swept all ten reachable pages in dark: no breakage, and the newly-live tints finally read as intended. Mobile audit found the ambience pill overlapping content and gave the page a 2×2 measure grid at 390.

**Phase 1 — the shell.**
- Ambience player: full pill → 44px puck (`6afa091`).
- Sidebar: nav ordered by how often the day touches it, active row quiet (`bg-background`, ink) instead of a filled primary block, 11px strapline (`0982f08`).
- Level meter: boxed XP card → one borderless object, `L12 · avatar · 2450 / 6000` over a 4px hairline (`0982f08`).
- Phone nav: two active languages → one, drawer links renamed to the sidebar's words and order, 11px labels (`7a8a2b6`).
- Skip link, `<main id="main">`, and `text-foreground` → `text-text-primary` in `index.html` because that utility is not a colour in this config and silently inherited (`b062d61`).

**A real bug found on prod.** With a pastel accent equipped, `--color-primary` was being overwritten, so headings, the wordmark, links and today's marker rendered pastel on pastel — about 1.3:1 in light theme. Split the concerns: `--color-accent` for fills, `--color-primary` stays ink, `Button`'s default variant became `bg-accent` (`7cd99c2`).

**Phase 2, first page — Habits.** Five competing badges per habit (category pill, goal chip, streak chip, weekday row, button row) collapsed into one ledger row: tick · title · `category · goal a day` · seven creases · streak · edit/delete. `TaskTick` grew a `done` state instead of a second component (`4337d32`).

**Accent redesign, on request.** The picker moved from the header into the account menu as a "Button accent" block; the palette became a sky ladder (Dawn, Morning, Noon, Midnight) with the old pastels retired in data rather than deleted so existing purchases still render; the default accent is the opposite of the theme (blue on light, white on dark) and an explicitly chosen accent is never overwritten; bounty XP turned green (`1890cb2`, plus `04f7b5b` sweeping stragglers).

**Verification habit that held throughout:** every page change was checked in both themes at 390 / 768 / ~1280 and on real prod after each push, with DOM reads for the things eyes miss (`aria-label`, computed colour, focus ring, nav order).

---

## 3. Session 2026-11-18 · afternoon — handoff reconciliation

Another agent had written a `HANDOFF.md` describing the project before the rebuild. Every claim was checked against the code; the doc was rewritten with a commit table, FIXED/PARTIAL/OPEN tags and file:line evidence, and its factual errors corrected (no code altered — wrong; "cream paper" — not the shipped world; blue buttons — that is the intended accent, not a violation). Findings the code confirmed as still open are listed in `HANDOFF.md §2`; the top one is that `gainXP` declares a `reason` it never reads, so the daily loop still celebrates nothing.

The owner then asked for "one chat that has all the history", which became **this file** — the long memory, with its own update protocol at the top so a future agent told to "update progress" writes a full section rather than a status line.

---

## 4. Commit ledger

| Commit | Intent |
|---|---|
| `e251e27` | login toggle restored in the masthead |
| `1e8b1c1` | Home rebuilt as a daily ledger |
| `8b1a046` | product context + design hook |
| `5d9b274` | Phase 0 foundations: channel tokens, ink colours, primitives, DESIGN.md, preview harness |
| `7cd99c2` | accent confined to buttons |
| `6afa091` | ambience player collapses to a puck |
| `0982f08` | sidebar order + quiet active row, level meter compressed |
| `7a8a2b6` | phone nav unified with the sidebar |
| `b062d61` | skip link, body colour that exists |
| `1890cb2` | sky accents, picker into the account menu |
| `04f7b5b` | sweep of the same accent change |
| `4337d32` | Habits: one row per habit |

---

## 5. Decisions and why

- **Channels over hex.** Only `rgb(var(--x) / <alpha-value>)` lets Tailwind attach alpha; hex silently deletes the class. Also: a token has two writers — the stylesheet and any inline `setProperty`.
- **Accent is a separate token.** Using `--color-primary` for the accent meant an accent choice repainted all type. Ink stays ink; accent fills buttons.
- **Retire, don't delete, old store items.** A user's purchase must survive a catalogue redesign.
- **Opposite-of-theme default, user choice wins.** No accent stored ⇒ the theme decides; once chosen, never reassigned.
- **Home has no workspace grid.** Duplicating the sidebar inside the page was the defect, not the fix.
- **The preview harness is dev-only.** No demo login in production auth; nothing imports `preview.html`, so it cannot ship.
- **No cream paper.** The world is slate page, white sheets, hairline borders, ink type, Fraunces numerals. A brief asking for warm paper conflicts with the tokens — ask first.

---

## 6. Working notes

- Vite dies on writes into `src/pages` (`EBUSY … .tmpdir`); restart the server each edit round, `npx tsc --noEmit` first.
- Never round-trip non-ASCII files through `Set-Content` — it rewrote `UI-ROADMAP.md` as ANSI.
- `git push` prints progress on stderr, so PowerShell reports exit 1 on success; verify with `git fetch` + `git log origin/main`.
- Detector can only apply element rules to a *running page*; file scans miss those. The cmd wrapper drops `&theme=` from a URL argument — quote or escape it.
- Screenshots referenced in earlier sessions live in `.impeccable/shots/` (72 files).

---

## 7. Maintenance

See **How to update this file** at the top — that section is the rule, this file is the memory.
