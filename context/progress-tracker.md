# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 01 — Design System & UI Primitives (complete)

## Current Goal

- Define the next feature unit to implement.

## Completed

- `01-design-system.md` — shadcn/ui installed and configured (Tailwind v4), dark theme CSS variables defined in globals.css, `@theme inline` Tailwind token mapping, `lib/utils.ts` with `cn()` helper, all 7 UI primitive components added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, TypeScript passes with zero errors.

## In Progress

- None yet.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Dark theme uses CSS custom properties defined in `globals.css` `:root`, mapped to Tailwind tokens via `@theme inline`. shadcn semantic tokens (background, foreground, card, primary, etc.) point to the project-specific dark theme variables so shadcn components pick up the correct colors without modification.
- `components/ui/*` files are not modified after shadcn generation — all customisation happens at the app-component level.

## Session Notes

- Tailwind v4 with `@import "tailwindcss"` — no tailwind.config.js.
- `components.json` uses `style: "default"`, `rsc: true`, `tsx: true`, `baseColor: "neutral"`, `cssVariables: true`.
- shadcn version pinned at 4.6.0 (installed by npx).
