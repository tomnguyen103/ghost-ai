# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- None

## Current Goal

- None

## Completed

- `01-design-system.md` — shadcn/ui installed and configured (Tailwind v4), dark theme CSS variables defined in globals.css, `@theme inline` Tailwind token mapping, `lib/utils.ts` with `cn()` helper, all 7 UI primitive components added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea), lucide-react installed, TypeScript passes with zero errors.
- `02-editor.md` — `components/editor/editor-navbar.tsx` (fixed navbar, sidebar toggle with PanelLeftOpen/PanelLeftClose, dark background + bottom border), `components/editor/project-sidebar.tsx` (floating overlay, slides from left, My Projects/Shared tabs with empty states, New Project button), dialog pattern confirmed ready via existing shadcn Dialog primitives.
- `03-auth.md` — `proxy.ts` at project root with `clerkMiddleware` (all routes protected except sign-in/sign-up), `ClerkProvider` wrapping root layout with Clerk `dark` theme (`@clerk/ui/themes`) and CSS variable overrides, `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` with 40/60 two-panel layout (left: `bg-surface` panel with circular `G` logo badge, large `text-5xl` headline, description paragraph, three icon-box feature rows with Lucide icons, copyright footer; right: `bg-base` with centered Clerk form; mobile shows form only), shared panel extracted to `components/auth/auth-left-panel.tsx`, `app/page.tsx` redirects authenticated users to `/editor` and unauthenticated to `/sign-in`, `UserButton` added to editor navbar right section.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Dark theme uses CSS custom properties defined in `globals.css` `:root`, mapped to Tailwind tokens via `@theme inline`. shadcn semantic tokens (background, foreground, card, primary, etc.) point to the project-specific dark theme variables so shadcn components pick up the correct colors without modification.
- `components/ui/*` files are not modified after shadcn generation — all customisation happens at the app-component level.
- Auth uses `proxy.ts` (Next.js 16 renamed middleware) exporting `proxy` function — not `middleware.ts`. Clerk's `clerkMiddleware` is assigned to the named `proxy` export.
- Clerk appearance: `theme: dark` (not `baseTheme`) from `@clerk/ui/themes` v1 API, variables overridden with project CSS custom properties — no hardcoded colors. `fontFamily` set to `'Geist', sans-serif` (font name, not CSS variable).
- Auth left panel: `w-2/5` (40%) with `bg-surface` to differentiate from `bg-base` right panel. Shared via `components/auth/auth-left-panel.tsx` — both sign-in and sign-up import this component.

## Session Notes

- Tailwind v4 with `@import "tailwindcss"` — no tailwind.config.js.
- `components.json` uses `style: "default"`, `rsc: true`, `tsx: true`, `baseColor: "neutral"`, `cssVariables: true`.
- shadcn version pinned at 4.6.0 (installed by npx).
- Next.js 16: `middleware.ts` is deprecated, renamed to `proxy.ts`; function export renamed from `middleware` to `proxy`.
