## Goal

Build the `/editor` home screen and add project dialogs/sidebar actions. No API calls or persistence yet.

## Editor Home

Reuse the exisiting editor layout. Do not modify the navbar or sidebar behavior.

In the center of the page, add:
- Heading: `Create a project or open an existing one`
- Description: `Start a new architecture workspace, or choose a project from the sidebar.`
- `New Project` button with a `Plus` icon

Keep layout minimal. Do not wrap this content in cards.

Clicking `New Project` should open the Create Project dialog.

## Dialogs

### Create Project
- Project Name input
- Live slug preview based on the name
- preview updates as the user type

### Rename Project
- Prefilled project name input
- Current project name shown in the description
- Input auto-focuses
- Enter submits

### Delete Project
- Destructive confirmation only
- No Input
- Confirm button use destructive styling

## Sidebar

Add project item actions:
- Rename
- Delete

Show actions only for owned projects.

Hide actions for shared/collaborator projects.

On mobile:
- Tapping outside the sidebar close it
- Add a backdrop scrim

## Implementation

Create a dedicate hook to manage:
- Dialog state
- Form state
- Loading state

Wire:
- Editor home `New Project` -> Create Dialog
- Sidebar create -> Create Dialog
- Sidebar rename -> Rename Dialog
- Sidebar delete -> Delete Dialog

Use mock project data only. Do not add API calls or persistence.

## Check when done
- Sidebar actions are wired
- Slug preview works
- No TypeScript errors
- No lint errors