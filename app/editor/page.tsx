import { NewProjectButton } from "@/components/editor/new-project-button"

export default function EditorPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <h1 className="text-2xl font-semibold text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-muted max-w-sm">
          Start a new architecture workspace, or choose a project from the sidebar.
        </p>
        <NewProjectButton />
      </div>
    </div>
  )
}
