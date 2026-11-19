# Design Brief

## Direction

Notation — a precision matrix workbench styled as a cool graph-paper engineering notebook.

## Tone

Refined technical minimalism: a scientific instrument, not a consumer app — restrained, dense, exact.

## Differentiation

Matrices render as true bracketed grids on a faint blueprint backdrop with tabular monospace digits that never jitter.

## Color Palette

| Token      | OKLCH       | Role                                    |
| ---------- | ----------- | --------------------------------------- |
| background | 0.975 0.006 250 | Cool off-white notebook paper       |
| foreground | 0.19 0.02 265   | Slate-ink text for dense reading    |
| card       | 1.0 0.002 250   | Crisp white panels for inputs/results |
| primary    | 0.48 0.2 275    | Electric indigo — calculate & active |
| accent     | 0.62 0.16 200   | Cyan-teal — focus rings, active pills |
| muted      | 0.945 0.01 250  | Inactive pills, secondary surfaces   |

## Typography

- Display: Space Grotesk — headings, app name, result values
- Body: DM Sans — labels, buttons, reference prose
- Mono: JetBrains Mono — all matrix cells, scalars, numbers (tabular)
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold uppercase tracking-widest`, body `text-base`

## Elevation & Depth

Flat paper base with white cards lifted by soft `shadow-subtle`; depth comes from layered surfaces, never gradients on backgrounds.

## Structural Zones

| Zone    | Background        | Border     | Notes                                     |
| ------- | ----------------- | ---------- | ----------------------------------------- |
| Header  | `bg-card`         | `border-b` | Sticky; app glyph + theme toggle          |
| Content | `bg-background`   | —          | Faint blueprint grid; two-column workspace |
| Footer  | `bg-muted/40`     | `border-t` | Reference links, monospace meta           |

## Spacing & Rhythm

Generous 1.5rem card padding and 1.5rem grid gaps; tight 0.5rem micro-spacing inside matrix cells for instrument density.

## Component Patterns

- Buttons: 8px radius, indigo `bg-primary` for Calculate, muted pill outline for operations, `transition-smooth` hover
- Cards: 8px radius, `bg-card`, 1px `border-border`, `shadow-subtle`
- Badges: pill, `bg-muted` with `text-muted-foreground`; active state uses `bg-accent` teal

## Motion

- Entrance: fade-in-up 0.35s ease-out, staggered 60ms across cards
- Hover: 0.2s color/shadow lift on buttons and pills
- Decorative: slow 12s pulse on the blueprint grid backdrop

## Constraints

- No raw color literals or arbitrary color classes — semantic tokens only
- All numbers and matrix values use `font-mono font-tabular`, rounded consistently
- Do not build eigenvalues/eigenvectors or LU/QR decomposition UI

## Signature Detail

Bracketed matrix rendering: tall thin bracket glyphs framing a tabular-mono grid on blueprint paper — the mathematical notation made literal.
