"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"

export default function EditorPage() {
  const { openCreate } = useProjectDialogsContext()

  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <h1 className="text-2xl font-semibold text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-muted max-w-sm">
          Start a new architecture workspace, or choose a project from the sidebar.
        </p>
        <Button onClick={openCreate} className="gap-2 mt-2">
          <Plus className="h-5 w-5" />
          New Project
        </Button>
      </div>
    </div>
  )
}
