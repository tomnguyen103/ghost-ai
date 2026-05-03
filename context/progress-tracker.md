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
- `04-project-dialogs.md` — Editor home screen (`app/editor/page.tsx`) with heading, description, and `New Project` button. `useProjectDialogs` hook (`hooks/use-project-dialogs.ts`) owns dialog/form/loading state and mock project data. `ProjectDialogsContext` shares state between sidebar and page. Three dialogs: `CreateProjectDialog` (name input + live slug preview), `RenameProjectDialog` (prefilled, auto-focus, Enter submits), `DeleteProjectDialog` (destructive confirm only). `ProjectSidebar` updated with project list, hover-reveal Rename/Delete actions for owned projects only, mobile backdrop scrim. All dialogs rendered from `EditorShell`. Slug validation guards empty-slug edge case (e.g. `"---"`) in hook handlers and dialog button disabled state. Zero TypeScript errors.
- `05-prisma.md` — `prisma/models/project.prisma` with `Status` enum (`DRAFT`, `ARCHIVED`), `Project` model (`id`, `ownerId`, `name`, `description?`, `status`, `canvasJsonPath?`, timestamps, `@@index([ownerId])`, `@@index([createdAt])`), and `ProjectCollaborator` model (`id`, `projectId` → `Project` cascade delete, `email`, `createdAt`, `@@unique([projectId, email])`, `@@index([email])`, `@@index([projectId, createdAt])`). `lib/prisma.ts` singleton branches on `DATABASE_URL`: `prisma+postgres://` uses Accelerate (`@prisma/extension-accelerate`), otherwise `@prisma/adapter-pg`; global-cached in development. Migrations applied, client generated to `app/generated/prisma`, `npm run build` passes.
- `06-project-apis.md` — REST API routes for project CRUD. `app/api/projects/route.ts`: `GET` lists caller's projects (`ownerId = userId`, ordered by `createdAt` desc); `POST` creates project (name defaults to `"Untitled Project"`). `app/api/projects/[projectId]/route.ts`: `PATCH` renames project (validates non-empty `name`); `DELETE` removes project (204 No Content). All routes: `401` for unauthenticated, `403` for non-owner mutations, `404` when project not found. Auth via `auth()` from `@clerk/nextjs/server`. `lib/prisma.ts` return type narrowed to `PrismaClient` to resolve union-type incompatibility with Accelerate extension. `npm run build` passes.
- `07-wire-editor-home.md` — `lib/projects.ts` with `SidebarProject` interface and `getProjectsForSidebar()` (fetches owned via `ownerId`, shared via `ProjectCollaborator.email` + `currentUser()`). `app/editor/layout.tsx` converted to async server component that calls `getProjectsForSidebar()` and passes `ownedProjects`/`sharedProjects` to `EditorShell`. `app/editor/page.tsx` converted to server component; New Project button extracted to `components/editor/new-project-button.tsx` (client component). `hooks/use-project-actions.ts` replaces mock hook: create uses `roomId = toSlug(name)` (project name only, no suffix), sends `{ name, id: roomId }` to `POST /api/projects` so project DB ID = Liveblocks room ID = slugified project name, then navigates to `/editor/{roomId}`; rename calls `PATCH` then `router.refresh()`; delete calls `DELETE` then redirects to `/editor` if active workspace else `router.refresh()`. `POST /api/projects` updated to accept optional `id` field and pass it to `prisma.project.create`. `EditorShell`, `ProjectSidebar`, context, and all three dialogs updated to use real `SidebarProject` type from `lib/projects`. `npm run build` passes.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.


## Re-implementation Notes (04-project-dialogs)

- All 8 files rewritten from scratch against spec on 2026-05-02.
- `inert` attribute removed from sidebar `<aside>` (was causing potential TS issues); pointer-events-none + translate handles the same intent.
- Sidebar mobile backdrop scrim rendered conditionally (`{isOpen && <div …/>}`) so it only exists in the DOM when the sidebar is open.
- Actions panel on project items uses `md:opacity-0 md:group-hover:opacity-100` — always visible on touch/mobile, hover-reveal on desktop.

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
- `useProjectActions` hook now captures errors in state (`error: string | null`) and exposes them via the hook. Each handler (`handleCreate`, `handleRename`, `handleDelete`) now calls `setError(message)` on failure instead of silent `console.error()`. Error is cleared on dialog open and on successful close. Dialog components should render error messages conditionally.
