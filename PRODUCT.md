# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: the owner — one person building and running their own morning routine, who opens Mornigami daily as a personal operating system for habits, tasks, focus, budget and study. Friends are a secondary audience, joining through the Community leaderboard and the shared XP economy rather than as a broad public.

## Product Purpose

Mornigami is one morning operating system: it folds habit tracking, task execution, focus blocks, personal finance and course-watching into a single daily workspace, then pays every completed action into one XP / level / rewards economy. It exists so its owner stops stitching several single-purpose apps together and can shape a whole day in one place. Success is daily personal use — the day's discipline held together, with every surface handing back a clear next action.

## Positioning

One morning OS on one XP economy. Single-purpose trackers cover habits, tasks, focus or money in isolation; Mornigami makes every hub pay into and draw from the same level, bounty and rewards-store loop, so progress in one discipline visibly advances all the others. The identity reinforces it: a paper-folding morning ritual — fold a habit, crease a distraction away — rather than a generic dashboard.

## Operating Context

- Daily, morning-first use, on desktop (collapsible sidebar) and phone (bottom navigation, safe-area insets), with distraction-free standalone windows for Pomodoro and To-Do.
- Six workspaces — Habits, To-Do, Pomogami (Pomodoro), Finance, Playlist Tracker, Rewards Store — plus the Home dashboard, Community leaderboard, Settings, and an owner-only Admin dashboard.
- The gamification loop runs across all of them: XP per action, levels every 500 XP × level, daily bounties that expire at midnight, and a store for accent colours, origami avatars and animated borders.
- Finance is salary-cycle based: monthly income, a derived daily budget, dual Visa/wallet balances, a savings vault and goal planner, with EGP as the default currency.
- Playlist Tracker handles imported video courses, per-video completion, learning groups and a motivational streak.
- Data is localStorage-first, mirrored best-effort to Firestore project `bishr-hub`; auth supports email, username or Google, plus password reset.
- Empty accounts are seeded with a believable demo workspace (five habits, a to-do list, a finance cycle, two playlists, focus history, level progress) so every page is explorable; Settings can restore it.

## Capabilities and Constraints

- Confirmed capabilities: habit creation with categories, schedules and streaks; tasks with priority and due dates; Pomodoro work/short/long modes with lofi/rain/café ambience, zen mode and a standalone window; finance expense logging, income, budgets, balances and savings goals; playlist import and tracking; XP store and leaderboard; profile picture upload; light/dark theme plus accent colours; owner admin over users, metrics, gamification and finance.
- Confirmed XP awards in code: habit +50, task +30, Pomodoro +150, video +40, learning group +200, daily-budget claim +50; each daily bounty awards its own XP. Level threshold: the next level needs current level × 500 XP.
- Open decisions (not confirmed): whether friends' accounts and their data become a supported multi-user product; whether the app is publicly deployed; whether the localStorage-first + Firestore sync model is fixed; whether demo seeding stays long-term.

## Brand Commitments

- The name **Mornigami** (morning + origami) is fixed.
- The app icon — a teal-blue origami paper crane on a transparent background (`src/public/icon.png`) — is fixed.
- The origami vocabulary is fixed and binding: fold, crease, unfold, shape; "Fold Master", "New Habit Fold", "Task creases", "Pomogami", "Unfold your potential". Future work keeps this language rather than swapping in generic productivity copy.

## Evidence on Hand

- A shipped demo workspace (see Operating Context) is the only populated evidence; it is seeded, not real usage.
- The Community leaderboard falls back to a seeded demo roster when `publicProfiles` is empty — those names are not real users.
- No testimonials, case studies, press, benchmark numbers or customer logos exist. Future work must not invent them.
- No production analytics or usage numbers were provided.

## Product Principles

1. One economy, many surfaces: any new feature either pays into or draws from the same XP / level / bounty / store loop; a surface that ignores the loop is off-strategy.
2. Personal first: design for one person's daily morning, and let friends join through the existing social surfaces; the product should never need a crowd to feel complete.
3. The day is the unit: habits, bounties and budgets renew daily, and morning is the moment the system exists to shape.
4. Identity is the fold: the name, the crane and the fold/crease language are part of the product, not decoration to be modernised away.
