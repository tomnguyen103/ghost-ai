"use client"

import { useEffect } from "react"
import { useWorkspace } from "./workspace-context"
import { CanvasRoom } from "./canvas-room"

interface WorkspaceShellProps {
  project: { id: string; name: string; slug: string }
}

export function WorkspaceShell({ project }: WorkspaceShellProps) {
  const { setWorkspaceProject, setAiSidebarOpen } = useWorkspace()

  useEffect(() => {
    setWorkspaceProject({ id: project.id, name: project.name, slug: project.slug })
    setAiSidebarOpen(true)
    return () => {
      setWorkspaceProject(null)
    }
  }, [project.id, project.name, project.slug, setWorkspaceProject, setAiSidebarOpen])

  return (
    <div className="relative h-full w-full">
      <CanvasRoom roomId={project.slug} projectId={project.id} />
    </div>
  )
}
