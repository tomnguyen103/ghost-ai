"use client"

import { useEffect } from "react"
import { useWorkspace } from "./workspace-context"

interface WorkspaceShellProps {
  project: { id: string; name: string }
}

export function WorkspaceShell({ project }: WorkspaceShellProps) {
  const { setWorkspaceProject, aiSidebarOpen, setAiSidebarOpen } = useWorkspace()

  useEffect(() => {
    setWorkspaceProject({ id: project.id, name: project.name })
    return () => {
      setWorkspaceProject(null)
      setAiSidebarOpen(false)
    }
  }, [project.id, project.name, setWorkspaceProject, setAiSidebarOpen])

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-1 items-center justify-center bg-base">
        <p className="text-sm text-copy-faint">Canvas workspace coming soon</p>
      </div>

      {aiSidebarOpen && (
        <aside className="flex w-80 shrink-0 flex-col items-center justify-center border-l border-border-default bg-elevated">
          <p className="text-sm text-copy-faint">AI chat coming soon</p>
        </aside>
      )}
    </div>
  )
}
