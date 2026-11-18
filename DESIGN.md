# DESIGN — Mornigami

The durable visual contract. Product truth lives in `PRODUCT.md`; this file records
decisions already made and the rules that keep later surfaces consistent with them.
Surface strategy for a single route lives in its surface brief.

## The world: the ledger

Mornigami is a morning system, so the interface behaves like the thing a disciplined
morning leaves behind: **sheets, hairlines, creases, and numbers you can read at a glance.**

A screen is a stack of **sheets** — one surface, rows divided by 1px hairlines. Not a grid
of cards, not a dashboard of tiles, not a panel with a gradient wash. Information that
belongs together shares a sheet. What separates two ideas is a hairline or whitespace,
never a shadow or a second border.

The paper-folding brand is carried by **creases**: one short tick per unit of work, filled
left to right, capped at eight. A crease row is the product's own chart — no rings, no
sparklines, no progress-shaped decoration.

## Tokens

Colours are **channel triplets** on `:root` / `.dark` in `src/index.css`
(`--color-primary: 15 23 42`) and mapped in `tailwind.config.js` as
`rgb(var(--color-x) / <alpha-value>)`.

> A hex value in a colour token silently kills every opacity modifier on that colour —
> the class compiles and paints nothing. Inline styles that write a colour token
> (`applyAccentColor`) must convert to channels too.

- `primary` is ink: near-black on light, white on dark. Buttons, checked creases, links.
- `surface` is the sheet, `background` is the desk, `border` is the hairline.
- `text.primary / secondary / tertiary` carry the three-step reading hierarchy.
- `success / warning / danger` are **state**, each with `.bg` (tint) and `.ink`
  (text-safe). On a tint use `.ink`, never the raw hue on white.
- Amber (`warning`) appears only where XP is owed or claimable. It is not decoration.
- `secondary` (cyan) marks a live/active system (today's group, an active group card),
  never a heading accent.

`color-scheme` is set per theme so native scrollbars, carets and form controls follow.

## Type

Two faces, no third:

- **Fraunces** (`font-display`) for numbers, greetings, sheet headings and page titles.
  Numbers always `tabular-nums`, `tracking-tight`, weight 900.
- **DM Sans** (`font-sans`) for labels, body, UI.

Sizes in use: display 30/36 (`text-3xl` / `sm:text-4xl`), sheet heading 16, body/label 14,
note/meta 12. A stat value may take a small prefix (currency code) at 12 bold — never a
third numeral size. Labels are sentence case, never ALL CAPS badging.

Max text measure 65–75ch; long copy gets a column, not full width.

## Layout

- Sheets sit in one column on small screens and split into two at `lg`
  (`minmax(0,1.65fr) minmax(0,1fr)` for a main column plus a side ledger).
- Padding inside a sheet: `p-4 sm:p-5`; page gutter comes from `MainLayout`.
- Radii: sheets `rounded-3xl`, controls `rounded-lg`/`rounded-[6px]`, creases `rounded-[1px]`.
- Grid gaps of one pixel over a `bg-border` parent produce hairline seams between cells —
  the seam is the divider.
- Touch targets ≥44px where the control is primary (task ticks, claim buttons on mobile).

## States

Every interactive element has hover, focus-visible and disabled. Focus is the global
2px ring on `primary` with offset 2 — never removed. Disabled reads as absence of
affordance, not as a grey tint. Empty states say what is missing and offer the one action
that fixes it.

## Motion

One authored moment at most per surface: 200ms colour/opacity transitions on state, a
2px lift on press (`active:scale-[0.98]`), bars that grow to their value. Nothing loops,
nothing bounces, nothing animates on scroll. `prefers-reduced-motion` disables decoration.

## Primitives

`src/components/ui/`: `Sheet`, `SheetHeading`, `Stat`, `Creases`, `TaskTick`, plus the
existing `Button`, `Card`, `Progress`. New surfaces compose these; a new visual idea
becomes a primitive only when a second surface needs it.

## Don't

- Don't add an eyebrow or kicker above a heading.
- Don't put a grid of equal cards of icon + title + text where a list or a sheet belongs.
- Don't nest a card in a card, or a sheet in a sheet.
- Don't use gradient text, coloured side borders over 1px, or hard offset shadows.
- Don't use monospace as a costume — only for code, data, measurements, countdowns.
- Don't use emoji or a unicode glyph as an interface icon.
- Don't pick light or dark by category; the theme is the user's.
- Don't repeat what the shell already shows (level, XP progress live in the top bar).
