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
- `08-editor-workspace-shell.md` — `lib/project-access.ts` with `getIdentity()` (Clerk userId + `primaryEmailAddress`) and `getProjectAccess()` (owner or collaborator check, returns project or null). `components/editor/access-denied.tsx` centered available-space layout with Lock icon and back link. `components/editor/workspace-context.tsx` React context holding `workspaceProject` and `aiSidebarOpen` state with setters. `EditorShell` owns workspace context state, derives the active route project from `/editor/[roomId]`, and provides `WorkspaceContext.Provider` wrapping the full tree. `EditorNavbar` reads `WorkspaceContext`: shows project name in center, Share button and AI toggle on right when in workspace mode. `ProjectSidebar` reads `WorkspaceContext`: project items are `<Link>` elements navigating to `/editor/[id]`, active item highlighted with `bg-brand-dim`. `components/editor/workspace-shell.tsx` client component that mounts, sets `workspaceProject` in context via `useEffect` (clears on unmount), renders canvas placeholder + AI sidebar placeholder (toggled by navbar). `app/editor/[roomId]/page.tsx` async server component: unauthenticated redirects to `/sign-in`, missing or unauthorized project renders `AccessDenied`, otherwise renders `WorkspaceShell`. `npm run build` and `npm run lint` pass.
- `09-share-dialog.md` — workspace Share button opens `components/editor/share-dialog.tsx`. Owners can invite collaborators by email, remove collaborators, view the collaborator list, and copy the project link with temporary `Copied!` feedback. Collaborators can open the same dialog in read-only mode and view the collaborator list only. Added `app/api/projects/[projectId]/collaborators/route.ts` with `GET` for owner/collaborator list access, `POST` for owner-only invites, and `DELETE` for owner-only removal. Added `lib/project-collaborators.ts` for email normalization, email validation, and Clerk Backend API enrichment (`displayName`, `avatarUrl`) with email-only fallback. `npm run build` and `npm run lint` pass.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Architecture Decisions (08-editor-workspace-shell)

- `WorkspaceContext` is owned by `EditorShell` (client component) so it can be read by both `EditorNavbar` (sibling) and `WorkspaceShell` (inside `<main>`). Context flows down through the shared `EditorShell` tree.
- `EditorShell` derives the active workspace project from the current `/editor/[roomId]` pathname as a fallback to the project set by `WorkspaceShell`, keeping the navbar/sidebar stable during workspace navigation.
- `WorkspaceShell` sets `workspaceProject` in context on mount and clears it on unmount, so the navbar reverts to default when navigating away from a workspace.
- Project items in `ProjectSidebar` are `<Link>` elements — `e.preventDefault()` on action buttons prevents link navigation when rename/delete is clicked.

## Architecture Decisions (09-share-dialog)

- Collaborator management uses a dedicated `app/api/projects/[projectId]/collaborators` route. `GET` is available to any user with project access; `POST` and `DELETE` require project ownership server-side.
- Collaborator emails are normalized to lowercase before storage and lookup because project access is email-based and should not depend on input casing.
- The share dialog derives owner vs collaborator capabilities from the API response instead of trusting client-side route or sidebar state.

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

## Bug Fixes

- `handleCreate` in `hooks/use-project-actions.ts` was missing `router.refresh()` after `router.push()`. After creating a project the layout held stale `ownedProjects` props (fetched at initial server render), so the new project never appeared in the sidebar and `routeWorkspaceProject` could not resolve the active project name in the navbar. Fix: call `router.refresh()` immediately after `router.push()` so Next.js re-fetches the layout's server data.
- `handleDelete` (active project) was missing `router.refresh()` after `router.push("/editor")`. The deleted project remained visible in the sidebar until a hard browser reload because the layout's `ownedProjects` was never invalidated. Fix: call `router.refresh()` alongside `router.push("/editor")`.
- `openRename` and `openDelete` did not clear the `error` state. Re-opening a dialog after a failed attempt showed the previous error immediately. Fix: call `setError(null)` in each open function (matching `openCreate`).
- `RenameProjectDialog` and `DeleteProjectDialog` never displayed the `error` prop — API failures were caught and stored in state but never shown, making the dialog appear frozen. Fix: accept `error?: string | null` in both dialogs and render it as a `text-error` line above the footer; `EditorShell` now passes `error={actions.error}` to both dialogs.

## Session Notes

- Tailwind v4 with `@import "tailwindcss"` — no tailwind.config.js.
- `components.json` uses `style: "default"`, `rsc: true`, `tsx: true`, `baseColor: "neutral"`, `cssVariables: true`.
- shadcn version pinned at 4.6.0 (installed by npx).
- Next.js 16: `middleware.ts` is deprecated, renamed to `proxy.ts`; function export renamed from `middleware` to `proxy`.
- `useProjectActions` hook now captures errors in state (`error: string | null`) and exposes them via the hook. Each handler (`handleCreate`, `handleRename`, `handleDelete`) now calls `setError(message)` on failure instead of silent `console.error()`. Error is cleared on dialog open and on successful close. Dialog components should render error messages conditionally.
- Workspace access and sidebar shared-project lookup use Clerk `primaryEmailAddress` for collaborator email matching.
