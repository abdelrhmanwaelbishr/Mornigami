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
- **State as of writing:** `origin/main` at `ae4fcc7`; local `main` at `eac8302` (+1 commit ahead, unpushed); `HANDOFF.md` and `PROJECT-HISTORY.md` tracked.

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

The owner then asked for "one chat that has all the history", which became **this file** — the long memory, with its own update protocol at the top so a future agent told to "update progress" writes a full section rather than a status line. And because a file nobody opens changes nothing, the owner asked for a repo-level **`AGENTS.md`** to make it binding: read this file before any task here, update it when the task is done. That file also carries the repo's ground rules (smallest complete change, design follows `DESIGN.md` rather than taste, verify in both themes at three widths, never commit secrets, push only when asked).

---

## 4. Session 2026-11-18 · late afternoon — live dynamic audit, silent loop root cause, and handoff

**Goal that arrived:** "tell me a good way to make the website more user-attractive, it attracts the user", followed by: "i want u to actually sign in to the website with these credentials ... and test what u need", asking for prioritized bullet points, `/handoff`, and saving it to the repo.

**Live dynamic verification.** Drove the running app on Vite (`127.0.0.1:5173`) using `ego-browser` (Citro Labs Ego Lite automation via CDP) as authenticated user Bishr (L5, 405 XP). Tested real interactions end-to-end:
- **Sign-in & Empty Workspace:** Signed in via `/login`. The real account had 1 habit (`dddd`), 0 tasks, 0 playlists, EGP 0 balance, and an expired finance cycle reading "1 days remaining".
- **Task creation & ticking:** Created "Attractiveness test task" in `/todo`. Ticked it: XP increased 405 → 435 (+30 XP) and persisted across reloads, but **zero feedback** appeared (no toast, no flash, no aria-live announcement).
- **Habit folding:** Folded habit `dddd` in `/habits`. XP increased 435 → 485 (+50 XP) and persisted, but zero feedback appeared at 120ms or 520ms.
- **Finance cycle:** Claimed daily budget bonus (+50 XP) with toast confirmation.
- **Store purchase:** Bought "Dawn Sky" accent (-300 XP, 485 → 185 XP). Successfully fired toast, celebration confetti, switched button accent to sky blue, and marked item "Equipped".
- **Level-up celebration:** Verified milestone celebration by parking XP at 2,470 / 2,500 and triggering level-up to L6: dialog modal opened with celebratory confetti canvas and "Keep Going!" button.
- **Pomodoro:** Ran countdown timer, paused, verified clock state updates.
- **Viewport & themes:** Audited Home and Todo at 390px mobile and 1440px desktop across both light and dark modes.
- **Clean up:** Deleted created test tasks and restored habit completion / XP state before exiting. Captured 13 verification screenshots in `.impeccable/shots/` (`live-02-after-signin.png`, `live-todo.png`, `live-finance.png`, `live-store.png`, `live-pomodoro.png`, `live-habits.png`, `live-flow-02-task-created.png`, `live-flow-06-store-bought.png`, `live-flow-09-home-dark.png`, `live-flow-10-home-390.png`, `live-flow-11-todo-390.png`, `live-flow-12-levelup.png`, `live-fold-feedback.png`).

**Discoveries & Root Causes:**
1. **The Silent Daily Loop:** Callers pass reasons to `gainXP(amount, reason)` (`TasksContext.tsx:78`, `HabitsContext.tsx:123`), but `GamificationContext.tsx:167` completely ignores the second argument. Ticking tasks and folding habits work silently, while shopping in the store fires confetti and toasts. Fixing this single function lights up the core loop across the entire product.
2. **The Acquisition Blindspot:** `/login` is a 380px single box with a standard `#2563eb` button and disabled Google login. Prospective users never see the crane, crease lines, or the calm ledger aesthetic before signing in. Proposed a two-column login previewing the workspace, or an unauthenticated `/demo` route reusing `src/preview.tsx`.
3. **Finance cycle floor bug:** `src/context/FinanceContext.tsx:156` floors `diffDays` at 1 forever (`const remainingDays = diffDays > 0 ? diffDays : 1;`), making months-expired cycles read "1 days remaining".
4. **Accessibility defects:** Todo task check is a 22px `<div onClick>` (`src/pages/Todo.tsx:514-522`) without keyboard accessibility or `aria-pressed`; per-group Add task button is an unlabelled `+` circle with only `title="Add task"` (`src/pages/Todo.tsx:464-478`).
5. **Layout collisions:** `FocusAudioPlayer.tsx:25` is fixed at `z-40`, colliding with task rows and mobile bounty headers. `src/public/icon.png` is 433 kB (should be an SVG ~10 kB).

**Decisions and why:**
- **Redact credentials:** Personal login credentials used during dynamic verification (`[REDACTED_EMAIL]`, `[REDACTED_PASSWORD]`) are strictly redacted in `HANDOFF.md` and `PROJECT-HISTORY.md`.
- **Preserve button accent:** Reaffirmed that `#2563eb` button fills on light theme are the intentional accent token, not a design violation.
- **Handoff persistence:** Saved the comprehensive findings report to `%TEMP%\handoff-mornigami.md` and committed it to the repo root as `HANDOFF.md` tagged OPEN/PARTIAL/FIXED.

**What shipped:**
- Handoff artifact written and placed in `HANDOFF.md` at repo root.
- No application code or database records modified in this pass.

**What was verified / What was NOT checked:**
- Verified live app dynamic flows via `ego-browser` on local Vite dev server.
- Did not run `npm run build` or push commits (push restricted to explicit user request).

**What remains:**
- Implement `gainXP` reason parameter with toast + polite aria-live announcement (with bulk-operation guard).
- Fix `remainingDays` calculation in `FinanceContext.tsx`.
- Replace Todo `<div onClick>` and add-task button with accessible semantic buttons.
- Adjust `FocusAudioPlayer` z-index/positioning.
- Continue `UI-ROADMAP.md` Phase 2 (Todo and Pomodoro ledger migration).

**Risks:**
- Adding `toast.success` inside `gainXP` will storm if triggered during `seedDemoData(true)` or admin batch XP edits; must be guarded.

---

## 5. Session 2026-11-18 · evening — Phase 2 finished: the receipt, and two pages moved onto the ledger

**Goal that arrived:** read what the project is, then "what's next on revamping the ui progress?", "what you'd do first?", "as short as possible, bullet points", then `/frontend-less-tokens start implementing.` — i.e. finish Phase 2 of `UI-ROADMAP.md`.

**Routing decision.** `/frontend-less-tokens` says pick one design authority. None was loaded: this repo already has one, `DESIGN.md`, and `AGENTS.md` forbids inventing a look. So the skill was used only for its shared rules and discipline; `ponytail` stayed on, `ego-browser` did the verification.

**Order chosen, and why.** XP receipt first because every award path funnels through `gainXP`, so one edit makes the whole loop legible; a page-level toast would have had to be duplicated six times. Then the shared header, then Pomodoro (the biggest visual debt), then Todo, then the correctness items *inside* those rewrites so the same files were not opened twice.

**What shipped — `21f43e8`, 12 files, +567 / −971:**
- `GamificationContext.tsx` — `gainXP(amount, reason)` now renders `+30 XP · Task completed` in Sonner for 2400 ms. Not `richColors`, not a celebration: the celebration stays on level-ups, which already fire confetti and the modal.
- `src/components/ui/PageHeader.tsx` (new) — title / note / actions, used by Habits, Pomodoro and Todo.
- `Pomodoro.tsx` rebuilt: the SVG donut, the `blur-3xl` glow and `animate-pulse` are gone. Numeral (30/36 display, `tabular-nums`), a 2px "crease" bar as the only progress mark, a set of four creases that fills per session, a hairline three-way mode switch, and a quiet full-screen Zen mode.
- `Todo.tsx` rebuilt: three stat cards, the list/grid toggle, `formatTaskDate` and the 22px `<div onClick>` check are gone. One sheet per due date on hairline seams, 44px `TaskTick`, priority as a coloured word, row actions only on hover/focus, drag-to-date kept.
- Correctness: `Task.completedAt` (`src/types/index.ts`), set and cleared in `TasksContext.toggleTask`; `BountiesContext` counts "completed today" from local calendar parts through a new `localDateKey`, and requires `completedAt`; `HabitsContext.computeStreak` walks real consecutive days, so a missed day now breaks the streak instead of the old lifetime counter.
- `demoData.ts`: the two seeded completed tasks got a `completedAt`, and the three pending tasks' due dates were moved off the future (see below).

**Discoveries:**
1. **`dayStr` counted the wrong way.** `dayStr` is `setDate(getDate() - offsetDays)`, so positive offsets are days *ago*; the demo tasks passed `dayStr(-1..-3)` and therefore sat in the future, which is why the first Todo screenshot read "Tomorrow · Friday, November 20 · Saturday, November 21". Fixed at the four call sites, not in the helper, and the convention is now commented.
2. **Demo seeding is version-blind.** `seedDemoData(force = false)` only writes empty keys, so a corrected seed never reaches a browser that already has data. Every verification run now clears `localStorage` first; otherwise you are testing yesterday's seed.
3. **The toast landed on the bar.** At `position="top-right"` the receipt covered the level meter and Sign In. Both mounts now pass `offset={{ top: 76, right: 16 }}` (`MainLayout.tsx:63`, `StandaloneLayout.tsx:47`) — "Receipts sit below the 64px bar instead of on top of it."
4. **A suspected filter bug that was not one.** A screenshot showed a just-ticked task still sitting under the Pending filter with the count already updated. A live DOM probe proved the opposite — group gone, `2 open · 5 done`, toast present — and the screenshot had simply caught the frame before React committed. Lesson: a screenshot is evidence of a frame, not of behaviour; probe the DOM before calling it a bug.

**Verified / not verified.** `npx tsc --noEmit` clean (4 runs) and `npx vite build` clean (403 kB main chunk, 9.5 s). Screenshots through `ego-browser` at 1280 / 768 / 390 in both themes for Todo, Pomodoro and Habits, with zero horizontal overflow at any of the twelve combinations. The receipt was proved by state, not by eye: `localStorage.userXP` went 2450 → 2480 and `[data-sonner-toast]` read `+30 XP · Task completed`. **Not checked:** the real signed-in app against Firestore (the preview harness runs on localStorage), Firefox/Safari, and whether Sonner's live region actually announces on this version.

**Deliberately left alone / open with the owner:**
- Zen mode uses a 60–72px numeral, which is a third numeral size and therefore against `DESIGN.md`. It is the one intentional departure; the owner has not yet said keep or drop it.
- At 390 the shell wordmark truncates to "Morni…" (left group gets 154px of 390). Measured, real, and Phase 1 shell work — not touched here.
- Habits category chips still scroll horizontally at 390 with a visible scrollbar (pre-existing).
- Still open from the audit: `FinanceContext.tsx:156` "1 day remaining" floor, `public/icon.png` at ~434 kB, `FocusAudioPlayer` stacking.

**Risks for the next agent.** `TasksContext.toggleTask` now writes `completedAt`; anything that reads `completed` alone (Admin, bounty maths, future history views) should be checked before assuming a date exists. `computeStreak` is recomputed on every toggle and on every Firestore sync, so a habit whose `completedDates` were written by the old code will show a *lower* streak than before — that is the correction, not a regression. The dev server still dies on writes into `src/` (EBUSY `.tmpdir`), so budget one restart per edit round.

### Same evening — the left sidebar (`eac8302`)

**Ask:** "revamp the left sidebar /frontend-less-tokens." Routed the same way as the rest of Phase 2: `DESIGN.md` is the authority, no second design skill.

**What changed and why:**
- **Brand row is now exactly `h-16`**, the top bar's height, so the two hairlines meet across the shell — they had been 72px and 64px, leaving a visible step at the seam.
- **Nav rows became one index instead of eight floating pills.** `divide-y divide-border` on the list, each row `min-h-11` (44px, measured), full-bleed, `rounded-xl` gone. This is the ledger rule applied to navigation: the seam is the divider, and a row is a line in a list, not a card.
- **The all-caps strapline "SHAPE YOUR MORNING" is gone** — an uppercase eyebrow is explicitly banned, and it was the loudest thing in the column. The brand line survives in sentence case at 11px.
- **Motion deleted, not tuned:** `active:scale-[0.98]` on every row and `group-hover:scale-105` on every icon were a tic, not a moment. Width now transitions in 200 ms; nothing scales.
- **The collapse control became a quiet row** matching the nav instead of a bordered full-width button (it was also 36px, under the touch floor). It is 44px now.
- **The wordmark is the home link and shows its own active state** (`end` on the `NavLink`), because Home has no nav row — before this, standing on `/` highlighted nothing at all.
- **Dead tokens deleted:** `--sidebar-width` / `--sidebar-width-minimized` were declared in `index.css` and read by nobody; they now disagreed with the component's 248/76.

**Verified by looking and by measuring:** `aside` 248px (76px minimized), brand row 64px with `brandBottom === headerBottom === 64`, every nav row 44px, no horizontal overflow at 1280 / 900 / 768, light and dark, expanded and collapsed. `npx tsc --noEmit` clean, `vite build` clean (402.79 kB main). **Not checked:** the real app with an admin account (the Admin row only appears for `userRole === 'admin'`, which the preview harness does not simulate), and the mobile drawer, which still has its own vocabulary — deliberately out of scope.

**Found on the way:** the dev preview harness mounted every page at `/`, so `NavLink` active states were untestable and the brand link always looked active. It now mounts the real route (`initialEntries` set to `/<page>` with a `path="*"` child), which is why the active-row behaviour could be confirmed at all.

---

## 6. Commit ledger

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
| `c1406dd` | docs: record the project history and reconcile the handoff |
| `84914b2` | docs(history): state the update protocol at the top, so a progress ask means the whole session |
| `7cc2c8f` | docs(agents): make reading the history and updating it part of every task |
| `a9a6a7f` | docs(history): record live dynamic audit findings and silent XP loop discovery |
| `21f43e8` | Phase 2 finished: XP receipt in `gainXP`, `PageHeader`, Pomodoro and Todo rebuilt, `completedAt` / local bounty day / real streak |
| `eac8302` | sidebar as an index of hairline rows; brand row meets the top bar; preview harness honours the route |

*2026-11-18 evening: the `a9a6a7f` row above resolves to `4f1060d` in the current history — the docs commit was rewritten, so grep for its message, not its hash.*

---

## 7. Decisions and why

- **Channels over hex.** Only `rgb(var(--x) / <alpha-value>)` lets Tailwind attach alpha; hex silently deletes the class. Also: a token has two writers — the stylesheet and any inline `setProperty`.
- **Accent is a separate token.** Using `--color-primary` for the accent meant an accent choice repainted all type. Ink stays ink; accent fills buttons.
- **Retire, don't delete, old store items.** A user's purchase must survive a catalogue redesign.
- **Opposite-of-theme default, user choice wins.** No accent stored ⇒ the theme decides; once chosen, never reassigned.
- **Home has no workspace grid.** Duplicating the sidebar inside the page was the defect, not the fix.
- **The preview harness is dev-only.** No demo login in production auth; nothing imports `preview.html`, so it cannot ship.
- **No cream paper.** The world is slate page, white sheets, hairline borders, ink type, Fraunces numerals. A brief asking for warm paper conflicts with the tokens — ask first.

---

## 8. Working notes

- Vite dies on writes into `src/pages` (`EBUSY … .tmpdir`); restart the server each edit round, `npx tsc --noEmit` first.
- Never round-trip non-ASCII files through `Set-Content` — it rewrote `UI-ROADMAP.md` as ANSI.
- `git push` prints progress on stderr, so PowerShell reports exit 1 on success; verify with `git fetch` + `git log origin/main`.
- Detector can only apply element rules to a *running page*; file scans miss those. The cmd wrapper drops `&theme=` from a URL argument — quote or escape it.
- Screenshots referenced in earlier sessions live in `.impeccable/shots/` (72 files).

---

## 9. Maintenance

See **How to update this file** at the top — that section is the rule, this file is the memory.
