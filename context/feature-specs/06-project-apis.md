The database schema is ready. Build the backend project API route only.

## Routes

Create REST endpoints for:
- `GET /api/projects`, list current user's projects
- `POST /api/projects` , create project
- `PATCH /api/projects/[projectID]`, rename project
- `DELETE /api/projects/[projectID]` , delete project

## Rules

Use the authenticated Clerk user ID as `ownerID`.

When creating:
- Default missing prject name to `Untitled Project`
- Use the schema's existing ID strategy, do not add sequential IDs

Security:
- Unauthenticated requests return `401`
- Only the project owner can rename or delete
- Non-owner mutations return `403`

Keep this backend-only. Do not wire the UI yet.

## Check when done
- Routes exist for list/create/rename/delete
- Owner checks are enforced for rename/delete
- `401` and `403` response are handled correctly
- `npm run build` passes