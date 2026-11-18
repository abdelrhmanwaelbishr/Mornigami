# Mornigami Handoff & Session State

**Last updated:** 2026-11-18 (second session — progress pass)
**Repository:** `D:/Programming/Mornigami Files/Mornigami`
**Working Stack:** React 18, TypeScript, Vite 5, Tailwind CSS, Firebase (Auth + Firestore), Sonner (Toasts), Canvas-Confetti
**Deployed:** https://mornigami.vercel.app (`origin/main` @ `4337d32`)

---

## 0. Progress since the first handoff (READ FIRST)

The previous handoff was written before the redesign started. Since then the design system, the app shell and two pages have landed. Everything below is committed and pushed — `git log --oneline` at `4337d32`:

| Commit | What |
|---|---|
| `5d9b274` | **Phase 0 foundations** — colour tokens became channel triplets (`--color-primary: 15 23 42`) and Tailwind maps `rgb(var(--color-x) / <alpha-value>)`, so the ~145 opacity classes that used to compile to **nothing** now work; `*-ink` text-safe state colours; five ledger primitives; `DESIGN.md`; dev preview harness |
| `7cd99c2` | accent split — `--color-accent` / `--color-accent-contrast`, `Button` default is `bg-accent`; the pastel accent no longer repaints headings |
| `6afa091` | ambience player collapses to a 44px puck instead of a full pill |
| `0982f08` | sidebar ordered by daily frequency + quiet active row; level meter compressed to `L12 · avatar · 2450/6000` |
| `7a8a2b6` | phone nav: 11px labels, one vocabulary with the sidebar, drawer links relabelled |
| `b062d61` | skip link, `<main id="main">`, `text-foreground` → `text-text-primary` in `index.html` |
| `1890cb2` + `04f7b5b` | accent picker moved into the account menu; sky palette (Dawn/Morning/Noon/Midnight); default accent is the opposite of the theme; retired pastels kept in data |
| `4337d32` | Habits rewritten as ledger rows; Todo day groups lost their 2px cyan outline |

**State of the rebuild:** `UI-ROADMAP.md` Phases 0 and 1 are done; Phase 2 is one page of three (Habits done, Todo partial, Pomodoro untouched).

**Visual truth is `DESIGN.md`, not "cream paper".** The world is: light slate page (`#F1F5F9`), white sheets on hairline borders, **ink** primary (`#0F172A` light / `#FFFFFF` dark) for type and checked creases, Fraunces display numerals, and one accent (`#2563EB` light default / `#FFFFFF` dark default) **reserved for button fills** — a heading or the wordmark must never take the accent. If a brief calls for warm paper, it conflicts with the shipped tokens; ask before changing.

---

## 1. Executive Summary & Context

The user's ask was to make Mornigami more attractive and engaging, then to execute the redesign roadmap in `UI-ROADMAP.md`. Live testing used the owner account (user: Bishr, L5) and the local demo harness; screenshots live in `.impeccable/shots/`.

**The highest-leverage discovery from the first pass still stands:** the core daily loop is silent. Ticking a task or folding a habit awards XP but fires no toast, no animation, no `aria-live` announcement. That is one function.

---

## 2. Findings & status

Legend: **OPEN** · **PARTIAL** · **FIXED**

### A. Broken interactions & silent feedback (highest leverage)
1. **`gainXP` drops the reason — OPEN.** `src/context/GamificationContext.tsx:46` declares `gainXP(amount, reason?)`; `:167` implements `(amount: number)` and never reads it. Callers pass `'Task Completed'` (`src/context/TasksContext.tsx:78`) and `'Habit Completed'` (`src/context/HabitsContext.tsx:123`). Fix in one place: `toast.success(...)` + a polite live region, with a guard so demo reseeding and admin batch writes don't storm.
2. **Finance cycle floor — OPEN.** `src/context/FinanceContext.tsx:156` `const remainingDays = diffDays > 0 ? diffDays : 1;` pins an expired cycle at "1 days remaining" forever.
3. **Home empty-state contradiction — FIXED** by the Home rewrite. `src/pages/Home.tsx:150` now branches on `tasks.length` ("Add your first task" vs "Everything is done") and the measure note reads "Nothing due today" (`:94`).
4. **Demo vs authenticated dissonance — OPEN.** `src/main.tsx:10` seeds demo data; a fresh cloud account lands on an empty workspace with no onboarding.

### B. Acquisition & first run
1. **Login hides the product — PARTIAL.** The masthead wordmark and a 44×44 theme toggle now sit above the form (`src/pages/Login.tsx`, `src/styles/login.css`), but it is still a single ~380px box: no crane mark at scale, no ledger preview, Google sign-in still disabled.
2. **First-run moment — PARTIAL.** Habits has an empty state with the accent "New Habit Fold" button; Home's empty state is correct copy but no XP-framed CTA ("Fold your first habit → +50 XP").
3. **Payoff below the fold — OPEN** at ≤750px: bounties and the 7-day strip sit below the first viewport on Home.

### C. Design consistency debt
1. **Card grids vs ledger — PARTIAL.** Home and Habits are ledger. Todo moved halfway (day groups are hairline sheets) but still has three shadowed stat cards, its own filter bar, and per-row tints (`bg-warning/5`, `bg-rose-500/5`). Pomodoro, Finance, Playlists, Store, Community, Settings and Admin are untouched `Card` grids.
2. **"Blue #2563eb buttons" — NOT A BUG.** The accent is *supposed* to be the button fill; light theme's default accent is `#2563EB` by the owner's instruction. What was wrong was the accent painting type; that is fixed. Do not convert buttons to ink.
3. **Banned patterns — OPEN.** Gradients at `src/pages/Todo.tsx:283` and `src/pages/Store.tsx:228` (line numbers drift — grep `bg-gradient`), ALL-CAPS eyebrows in Playlists/Store, emoji as functional icons (Finance categories, Admin delete).

### D. Accessibility & layout
1. **Todo task tick — OPEN.** `src/pages/Todo.tsx:514-523` is still a 22px `<div onClick>` with no role, no key handling, no `aria-pressed`. `TaskTick` (`src/components/ui/TaskTick.tsx`) already does this correctly for Habits — reuse it.
2. **Todo add-task button — PARTIAL.** It is a real `<button type="button" title="Add task">` (`src/pages/Todo.tsx:464-478`), but 32×32 (below the 44px touch floor) and named only by `title`. Give it `aria-label` and a larger hit area.
3. **Audio player overlap — PARTIAL.** `src/components/layout/FocusAudioPlayer.tsx:25` is a collapsed 44px puck at `fixed bottom-20 right-3 md:bottom-4 md:right-4 z-40`. It still overlays the corner (a few characters of the last bounty row at 390px) but no longer covers rows.
4. **MobileNav collision — not reproduced.** Bottom bar is `z-30` with `safe-area-pb` (`src/components/layout/MobileNav.tsx:104`); `MainLayout` main carries `pb-24 md:pb-8`. Reopen only if it is seen again.
5. **Favicon bloat — OPEN.** `src/public/icon.png` is 443,844 bytes; target ~10 kB.

### E. Working features — do not break
- XP accumulation, level thresholds, level-up modal + confetti.
- Store purchase, badge/avatar/border equipping, accent switching.
- Pomodoro countdown and controls.
- Theme switching in both directions, including on `/login`.
- **New invariants:** the accent fills buttons only; headings, numerals and the wordmark stay ink; sheets sit on hairlines with no shadow at rest.

---

## 3. Credentials & sensitive information

- Live account tested: Bishr (`[REDACTED_EMAIL]`).
- Password: `[REDACTED_PASSWORD]`.
- Test tasks created during recon were removed via the UI before the session ended.

---

## 4. Skills for the next agent

- **`impeccable`** — for any surface work; Operate surfaces are code-led, and `DESIGN.md` is the contract.
- **`ponytail`** — smallest complete change; the repo has enough abstraction already.
- **`ego-browser`** — the sanctioned browser for screenshots, 390px checks, and live verification. Do not launch Chrome/Brave/Edge windows of your own.
- **`ui-taste` / `frontend-design`** — micro-interactions and anti-slop pass on a page.
- **`graphify`** — `graphify-out/graph.json` exists; query it before re-reading pages.
- **`rtk`** — verbose build/lint output.

---

## 5. Next actions, in order

1. **Silence (A1).** Implement the `gainXP` reason → toast + live region. One file, huge felt difference; guard against reseed storms.
2. **Finish Phase 2.** Pomodoro is the big one: it should *be* the page — one Fraunces number, one primary control, today's sessions as creases, no decorative blur behind a card. Then Todo: replace the three shadowed stat cards and the filter bar with a ledger header, reuse `TaskTick`, and drop the per-row tints.
3. **Cheap correctness.** Finance floor (A2), Todo tick semantics (D1), add-task label (D2), icon.png (D5).
4. **Phases 3–6** of `UI-ROADMAP.md`: Finance + Playlists (money needs `Intl` formatting; Playlists' modal stack becomes a sheet), then Community/Store/Settings, then Admin + standalone windows + login parity, then states/motion/a11y/perf.

---

## 6. Working notes (learned the hard way)

- **Tokens have two writers.** `ThemeContext.applyAccentColor` writes `--color-accent` inline; the stylesheet owns `--color-primary`. An inline hex there silently defeats the alpha mapping.
- **`text-foreground` is not a colour** in this Tailwind config — it silently inherits. Use `text-text-primary`.
- **Never round-trip non-ASCII files through `Set-Content`** (it rewrote `UI-ROADMAP.md` as ANSI and broke the em dashes). Use the editor/write tool.
- **Vite dies on writes into `src/pages`** with `EBUSY: resource busy or locked` on the editor's `.tmpdir`; every edit round needs a server restart (`npx tsc --noEmit` first as a cheap gate).
- **Dev preview harness:** `preview.html` + `src/preview.tsx` render any page with seeded demo data (`?p=home|habits|todo|pomodoro|finance|playlist|store|community|settings|admin&theme=light|dark`) on `npx vite --port 5210 --strictPort`. Neither file is imported by `index.html`, so nothing ships.
- **`git push` prints progress on stderr**, so PowerShell reports exit 1 on success. Verify with `git fetch` + `git log origin/main`.
