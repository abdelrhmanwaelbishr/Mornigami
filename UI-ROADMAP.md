# Mornigami UI Roadmap

Turning eleven screens that each grew their own layout into one product with one visual language.

Written against the code as it stands after `1e8b1c1` (home dashboard rebuilt) and `e251e27` (login toggle).

**Status.** Phase 0 is implemented: colour tokens are channel triplets with alpha-aware
Tailwind mappings, the inline accent writer no longer bypasses them, ink tokens exist for
state text, the ledger primitives (`Sheet`, `SheetHeading`, `Stat`, `Creases`, `TaskTick`)
live in `src/components/ui/`, `DESIGN.md` records the contract, and a dev-only preview
(`preview.html` + `src/preview.tsx`, never in the production bundle) shows every page with
demo data. Phases 1–6 are untouched.

---

## 1. Where the product is now

| Fact | Number |
|---|---|
| Pages | 11 (`src/pages/*.tsx`) + 2 standalone windows |
| Page code | 7,997 lines — Admin 2,055, Playlists 1,306, Finance 851, Todo 755, Login 640, Pomodoro 490, Settings 384, Habits 336, Community 304, Home 299, Store 295 |
| Shared UI kit | 10 files in `src/components/ui` (Button, Card, Badge, Dialog, DropdownMenu, Input, Progress, Separator, Switch, Tabs) |
| `Card` usages in pages | 36 (17 of them in Admin) |
| Uppercase class usages | 10 in pages, 6 in components |
| Gradient panels | 2 (`src/pages/Todo.tsx:283`, `src/pages/Store.tsx:228`) |
| **Alpha tints that compile to nothing** | **108 usages across 15 files — 0 rules emitted to CSS** |
| Design docs | `PRODUCT.md` (product truth) — no `DESIGN.md` yet |

Three things are already good and must survive: one `h1` pattern (`font-display text-3xl font-black`), one token set in `src/index.css`, and one XP economy rendered consistently (level badge in `src/components/layout/TopBar.tsx`, claims in the dashboard).

The problem is composition, not styling. Most pages currently answer "what can you do here" with a header + a hero panel + a grid of cards. The rebuilt dashboard is the only page that answers "what is my day".

## 2. The direction

**One idea: the ledger.** Mornigami is a folding ritual, so surfaces behave like paper — sheets separated by hairlines, measures sitting on seams, progress drawn as creases, one accent per state. No floating cards inside cards, no decorative banners, no gradients as wallpaper.

**Recognisable with all content removed:** cream/near-black ground, Fraunces for numbers and page titles only, DM Sans for everything else, 1px hairlines `--color-border`, 24px sheet radius, crease ticks, and a single amber accent that only ever means "XP available".

**The three rules that make it hold** (write them into `DESIGN.md` in Phase 0):

1. A surface is a sheet, not a card. Sheets are separated by hairlines and spacing; nothing nests.
2. Every number is set in Fraunces with `tabular-nums`; every label is DM Sans at 12px. No third size.
3. Colour is a state, not decoration: amber = unclaimed XP, red = overdue/destructive, green = done. Nothing else is coloured.

### Decision to confirm before Phase 1

| Path | Cost | What you get |
|---|---|---|
| **A. Unify (recommended)** | ~2.5–3× the work of one page | Keep the current world, rebuild every page as a ledger, one kit |
| B. New visual world | 4–5× | A different Mornigami; discards this week's login and dashboard work |

This plan is written for **A**. If B, stop after Phase 0 and re-run `/impeccable` for a new world before touching pages.

---

## 3. Phases

Each phase ships independently and leaves the app working. "Exit" is what must be true before the next phase starts.

### Phase 0 — Foundations (do this first, or every page reinvents it)

**0.1 Fix the token alpha system — the highest-value bug in the repo.**
`bg-primary/10`, `divide-border/60`, `hover:bg-danger/10`, `border-warning/30` and 100+ friends emit **no CSS at all**: the colour tokens are hex strings, so Tailwind cannot attach an alpha channel and silently drops the class. Consequence today: icon tiles have no tint, hover states have no feedback, soft borders do not exist, selected rows do not read as selected.

Fix: store tokens as channel triplets (`--color-primary: 15 23 42`) and map Tailwind to `rgb(var(--color-primary) / <alpha-value>)`. Every consumer that reads `var(--color-x)` directly (`src/index.css` borders, shadows, sparkle/fire/rainbow borders) must be updated in the same commit.
Verify: `.bg-primary\/10` **exists** in `dist/assets/*.css` and a rendered tile measures a real `rgba(...)`.
⚠ Expect the app to look different everywhere the moment this lands — tints and hovers appear. Budget one visual sweep across all pages in the same session, and fix what the tints expose (badge contrast, icon-on-tint pairings).

**0.2 Text-safe state colours.** Add `--color-warning-ink`, `--color-danger-ink`, `--color-success-ink` (the `amber-700` / `red-600` pair currently hardcoded on light). Pages stop inventing shades; both themes pass 4.5:1.

**0.3 Extract the primitives the dashboard already proves.** In `src/components/ui`: `Sheet`, `SectionHeading`, `Stat`, `LedgerRow`, `Chip`, `EmptyState`, `Creases`, `TaskTick`. Refactor `src/pages/Home.tsx` onto them with **zero visual change** — that is the test that they are the right primitives.

**0.4 Make verification cheap.** There is no dev login; every visual check currently needs a temporary harness that must be deleted afterwards. Add a dev-only demo entry (`import.meta.env.DEV` + a `?demo` route, or a "Use demo workspace" button on the login screen that the production build drops).

**0.5 Write `DESIGN.md`** from the primitives: palette, type scale, radii, spacing, the three rules, state colours, motion budget (one authored moment, 150–200 ms, colour/transform only).

**Exit:** alpha classes compile and measure; `DESIGN.md` committed; Home renders identically on the new primitives; `npx tsc --noEmit` and `npx vite build` clean.

### Phase 1 — The shell (every page inherits it)

- **Sidebar** (`src/components/layout/Sidebar.tsx`): an active state that actually reads; group the eight destinations by intent (Today / Work / Money / Social); keep the collapse.
- **TopBar** (`TopBar.tsx`, 278 lines): level badge and XP bar compress into one object; theme, accent and account stop competing for the same corner.
- **MobileNav** (`MobileNav.tsx`, 321 lines): five destinations plus a sheet for the rest; the 10px labels go to 11–12px.
- **FocusAudioPlayer** (`FocusAudioPlayer.tsx`): today it floats bottom-right and covers content — the bounties header at 768, the last task row at 390. Either dock it into the top bar as a one-line control or collapse it to a 40px puck that never sits over interactive content.
- Skip link, `color-scheme`, `theme-color`, scrollbars visible in both themes.

**Exit:** screenshots of every route at 390 / 768 / 1440 in both themes, player open and closed; no overlap on any of them.

### Phase 2 — The daily loop (highest frequency, highest payoff)

| Page | Today | Becomes |
|---|---|---|
| `Habits.tsx` (336) | grid of cards with streak badges and per-habit buttons | one ledger: each habit a row with its week of creases inline, streak as a number, fold action on the right |
| `Todo.tsx` (755) | seven sections, priorities, drag-and-drop | ledger grouped Today / This week / Later; priority as a 2px crease, not a coloured block |
| `Pomodoro.tsx` (490) | timer inside a card, blurred motion decoration | the timer **is** the page: one number, one control, sessions as creases; zen and standalone inherit it |

**Exit:** the three pages share the same header, sheet and row primitives; folding a habit, completing a task and finishing a session all visibly feed the same XP economy without leaving the page.

**Done — `4337d32` (Habits) and `21f43e8` (Todo, Pomodoro).** `PageHeader` is the shared header; all three pages are one sheet (or one sheet per day, in Todo's case) of hairline rows; `gainXP` now returns a visible receipt, so every action feeds the loop on the page. Deliberate departures: Todo groups by due date rather than Today / This week / Later (the data has dates, not buckets), priority is a coloured word rather than a crease (a 2px crease could not carry three levels), and Zen mode uses a larger numeral than the rest of the app — flagged to the owner.

### Phase 3 — Money and learning

- `Finance.tsx` (851): cycle header with three measures (budget, spent, left), expenses as a ledger with a running total, savings and goals on one sheet. Tables keep `tabular-nums` and aligned decimals.
- `Playlists.tsx` (1,306): groups become a video ledger with completion creases; the import flow becomes a sheet, not a modal stack.

**Exit:** both readable at 390 with no horizontal scroll; every currency and percentage formatted through `Intl`.

### Phase 4 — Social, market, account

- `Community.tsx` (304): leaderboard as a table with rank as a crease, friends below, no card grid.
- `Store.tsx` (295): the item grid is legitimate here (things to buy) — restyle in the sheet language and kill the gradient banner at line 228.
- `Settings.tsx` (384): grouped sections, one sheet per group; destructive actions get one red row, not a red card.

**Exit:** all four read as the same product as the dashboard; no uppercase eyebrow above a heading.

### Phase 5 — Admin, standalone, login parity

- `Admin.tsx` (2,055, internal, lowest priority): tokens and table styling only — no bespoke design. Hard-cap this phase at one session, then stop.
- `StandaloneTodo` / `StandalonePomodoro`: inherit the new primitives so a distraction-free window looks like the app.
- `Login.tsx`: already revamped — align to the token fixes and re-check contrast after 0.2.

**Exit:** Admin is not embarrassing, and no page uses a one-off colour.

### Phase 6 — Finish the whole thing

- States: empty, loading (skeletons, not spinners), error, success — one pattern each, app-wide.
- Motion: one authored moment per surface (crease fill, claim); everything else ≤120 ms colour.
- Accessibility sweep: heading order, focus visible on every control, 44px targets, contrast ≥4.5:1, `aria-live` for XP changes, reduced motion honoured.
- Performance: `src/public/icon.png` is **443 kB** for a logo — ship an SVG/WebP at ~10 kB; re-audit the 414 kB app chunk after the refactors.
- `DESIGN.md` refreshed; `impeccable detect` clean on every touched file.

**Exit — definition of done for the roadmap:** every route tested at 390 / 768 / 1440 in both themes; no dead alpha class left in `src`; one `h1` per page; no page invents a colour, radius or type size; demo data still seeds and every action still writes the same Firestore paths.

---

## 4. Sequence and effort

| Phase | Scope | Rough effort | Blocking risk |
|---|---|---|---|
| 0 Foundations | tokens, primitives, DESIGN.md, dev entry | 1–2 sessions | app-wide visual shift after the alpha fix |
| 1 Shell | 4 components | 1 session | player and overlap decisions |
| 2 Daily loop | Habits, Todo, Pomodoro | 3–4 sessions | Todo holds drag-and-drop logic |
| 3 Money + learning | Finance, Playlists | 3 sessions | Finance holds money rules |
| 4 Social/market/account | Community, Store, Settings | 2 sessions | the Store grid may resist the ledger |
| 5 Admin + standalone | Admin cap, 2 windows, login | 1–2 sessions | Admin is 2,055 lines |
| 6 Finish | states, motion, a11y, perf | 2 sessions | nothing ships without it |

**Order is not negotiable for 0 → 1 → 2.** Phases 3–5 can run in any order; 6 closes the whole thing.

## 5. Risks

- **The alpha fix is a big bang.** 108 classes switch on at once. Land it early, in one commit, with all eleven pages photographed before and after.
- **No test suite.** Verification is `tsc`, `build`, screenshots and the detector. Refactors of `Todo`, `Playlists` and `Finance` move logic with no tests — extract, don't rewrite, and re-test each action by hand.
- **Money and sync paths are load-bearing.** `FinanceContext`, `TasksContext` and `HabitsContext` write to Firestore; UI work must not change those call paths.
- **Demo seeding is the product demo.** `seedDemoData()` must keep producing a full-looking workspace or the app looks empty on first run.
- **Dark mode is an override layer, not a theme.** Many pages carry `dark:` utilities on top of tokens; 0.1 must document which is allowed where, or the two systems keep fighting.
- **Admin can eat a sprint.** 2,055 lines of internal UI. Cap it and accept "plain but consistent".

## 6. Working method for every phase

1. Capture the before state at 390 / 768 / 1440, both themes, with real demo data.
2. Rebuild the page on the primitives — no new colours, no new type sizes.
3. Look once, fix everything that look shows, look again.
4. `npx tsc --noEmit`, `npx vite build`, `impeccable detect --json <files>`.
5. Update `DESIGN.md` if a rule changed; if a rule changes twice it was wrong — rewrite it there.

---

*Uncommitted working document. `PRODUCT.md` is the product truth; this file is only the path from the current UI to the one described in §2.*
