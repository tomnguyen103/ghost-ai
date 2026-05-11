# Development Plan Tools

Development Plan Tools is a dark, real-time collaborative system design workspace. Users create architecture projects, collaborate on a Liveblocks + React Flow canvas, ask an AI agent to generate or refine system diagrams, and generate persistent Markdown technical specifications from the final graph.

Demo: [https://development-tool.tomnguyen.me/](https://development-tool.tomnguyen.me/)

## Current Status

The implementation is functionally complete through the current feature spec set in `context/feature-specs`, with additional fixes for realtime spec/project updates, spec deletion, and task error handling.

## Tech Stack

This stack reflects the current `package.json` dependencies and the app integrations in `app/`, `components/`, `lib/`, and `trigger/`.

| Area | Technology |
| --- | --- |
| App framework | Next.js 16.2, React 19.2, TypeScript 5 |
| Routing/runtime | Next.js App Router, React Server Components, `proxy.ts` route protection |
| Styling and UI | Tailwind CSS v4, shadcn/ui primitives, Radix UI, Lucide React, Geist fonts via `next/font` |
| Authentication | Clerk Next.js SDK and Clerk UI dark theme |
| Database | PostgreSQL with Prisma ORM 7.8 |
| Database drivers | `pg`, `@prisma/adapter-pg`, and Prisma Accelerate support |
| Realtime collaboration | Liveblocks 3.18 presence, room events, auth, undo/redo, and cursors |
| Canvas editor | React Flow via `@xyflow/react` 12.10 and `@liveblocks/react-flow` |
| Background tasks | Trigger.dev SDK 4.4 and Trigger.dev React realtime hooks |
| AI generation | Vercel AI SDK 6 with Google Gemini via `@ai-sdk/google` |
| Artifact storage | Vercel Blob for canvas snapshots and generated Markdown specs |

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` with the project services configured:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

LIVEBLOCKS_SECRET_KEY="sk_..."
TRIGGER_PROJECT_REF="proj_..."
TRIGGER_SECRET_KEY="tr_..."

GOOGLE_AI_API_KEY="..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

Apply migrations and generate Prisma Client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Run the Next.js app:

```bash
npm run dev
```

Run the Trigger.dev worker in a second terminal for AI design and spec jobs:

```bash
npx trigger.dev@latest dev
```

Open the app:

```text
http://localhost:3000
```

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npx prisma studio
npx trigger.dev@latest dev
```

## Implementation Progress

Progress follows the order of `context/feature-specs`.

| Spec | Status | Implemented |
| --- | --- | --- |
| `01-design-system.md` | Complete | shadcn/ui, Tailwind v4 dark tokens, `cn()`, UI primitives, Lucide React. |
| `02-editor.md` | Complete | Editor navbar, collapsible project sidebar shell, dark workspace chrome. |
| `03-auth.md` | Complete | Clerk provider, protected routes via `proxy.ts`, sign-in/sign-up pages, editor redirect, user menu. |
| `04-project-dialogs.md` | Complete | Editor home, create/rename/delete dialogs, project dialog state, sidebar actions. |
| `05-prisma.md` | Complete | Project and collaborator models, Prisma singleton, migrations, generated client. |
| `06-project-apis.md` | Complete | Authenticated project CRUD APIs with owner checks and consistent error responses. |
| `07-wire-editor-home.md` | Complete | Server-loaded owned/shared project lists, real project actions, slug/room ID creation. |
| `08-editor-workspace-shell.md` | Complete | `/editor/[slug]` workspace route, server access checks, workspace context, access denied view. |
| `09-share-dialog.md` | Complete | Share dialog, collaborator invite/remove APIs, owner/collaborator capability split. |
| `10-liveblocks-setup.md` | Complete | Liveblocks config, room auth API, user metadata, cursor colors, room access grants. |
| `11-base-canvas.md` | Complete | Liveblocks-backed React Flow canvas, room provider, suspense and error fallbacks. |
| `12-shape-panel.md` | Complete | Bottom shape toolbar, drag payloads, node creation on canvas drop. |
| `13-node-shape.md` | Complete | Shape-specific node rendering and matching drag ghost previews. |
| `14-node-editing.md` | Complete | Node resizing and inline collaborative label editing. |
| `15-node-color-toolbar.md` | Complete | Selected-node color swatches using the shared node palette. |
| `16-edge-behavior.md` | Complete | Custom edges, arrowheads, hover/select behavior, inline edge labels. |
| `17-canvas-ergonomics.md` | Complete | Zoom controls, fit view, undo/redo, keyboard shortcuts. |
| `18.starter-template.md` | Complete | Starter template library, preview modal, template import into canvas. |
| `19-presense-avatars-cursor.md` | Complete | Presence avatars, current-user Clerk button, live collaborative cursors. |
| `20-ai-sidebar-shell.md` | Complete | AI sidebar component with AI Architect, Chat, and Specs surfaces. |
| `21-canvas-autosave.md` | Complete | Canvas load/save APIs, Vercel Blob persistence, autosave status indicator. |
| `22-design-agent-api.md` | Complete | Design trigger API, Trigger.dev run tracking, realtime token route. |
| `23-design-agent-logic.md` | Complete | Gemini design agent that mutates the collaborative canvas through Liveblocks flow utilities. |
| `24-ai-presence-state.md` | Complete | Shared AI status events, thinking indicators, disabled input while AI is active. |
| `25-sidebar-chat-feed.md` | Complete | Realtime room chat feed in the AI sidebar via Liveblocks room events. |
| `26-ai-chat-functional.md` | Complete | Prompt submission, Trigger.dev realtime run tracking, assistant completion messages. |
| `27-spec-generation-flow.md` | Complete | Spec generation API, Trigger.dev task, scoped realtime token route, run ownership. |
| `28-spec-persistence-download.md` | Complete | `ProjectSpec` persistence, private Blob upload, secure Markdown download route. |
| `29-spec-ui-integration.md` | Complete | Spec list, Markdown preview modal, download button, realtime refresh after generation. |

## Recent Follow-Up Work

- Spec creators can delete their own generated specs.
- Spec creation and deletion broadcasts update all collaborators in the active room.
- Owner project deletion redirects collaborators out of the deleted room in real time.
- AI design and Liveblocks auth routes return JSON errors instead of HTML error pages.
- Gemini model alias was updated to `gemini-2.5-flash`.
- Canvas shape rendering, minimap rendering, and drag previews were aligned.

## Development Notes

- Next.js 16 uses `proxy.ts` instead of the older `middleware.ts` convention.
- Before changing Next.js APIs or file structure, read the relevant guide in `node_modules/next/dist/docs/`.
- UI is dark-only. Use CSS/Tailwind tokens from `app/globals.css`; avoid raw color utility classes for app UI.
- `components/ui/*` contains generated shadcn primitives and should stay reusable.
- Project URLs, database IDs, and Liveblocks room IDs are aligned as `project.id = project.slug = roomId`.
- Long-running AI work belongs in Trigger.dev tasks, not route handlers.

## Troubleshooting

Check required environment variables from PowerShell:

```powershell
Get-ChildItem Env:DATABASE_URL,Env:LIVEBLOCKS_SECRET_KEY,Env:TRIGGER_PROJECT_REF,Env:GOOGLE_AI_API_KEY,Env:BLOB_READ_WRITE_TOKEN
```

If Prisma queries fail because a column is missing:

```bash
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
```

If AI requests return `Trigger.dev unavailable` or a design/spec run never starts:

```bash
npx trigger.dev@latest dev
```

If the app compiles but TypeScript reports hidden issues:

```bash
npx tsc --noEmit
```

If Liveblocks returns room access errors:

```text
Confirm LIVEBLOCKS_SECRET_KEY is set, then sign in again and reopen the project room.
The auth route grants room access when /api/liveblocks-auth is called.
```

If generated specs do not appear:

```text
Confirm the Trigger.dev worker is running, BLOB_READ_WRITE_TOKEN is valid,
and the latest Prisma migrations include ProjectSpec.creatorId.
```
