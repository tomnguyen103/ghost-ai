"use client"

import { useState } from "react"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { ProjectDialogsContext } from "./project-dialogs-context"
import { CreateProjectDialog } from "./create-project-dialog"
import { RenameProjectDialog } from "./rename-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { SidebarProject } from "@/lib/projects"

interface EditorShellProps {
  children: React.ReactNode
  ownedProjects: SidebarProject[]
  sharedProjects: SidebarProject[]
}

export function EditorShell({ children, ownedProjects, sharedProjects }: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const actions = useProjectActions()

  return (
    <ProjectDialogsContext.Provider value={actions}>
      <div className="flex h-screen flex-col bg-base">
        <EditorNavbar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
        />
        <main className="flex flex-1 flex-col pt-12 overflow-hidden">
          {children}
        </main>
      </div>

      <CreateProjectDialog
        open={actions.dialog === "create"}
        name={actions.createName}
        roomId={actions.createRoomId}
        loading={actions.loading}
        onNameChange={actions.setCreateName}
        onConfirm={actions.handleCreate}
        onClose={actions.close}
      />
      <RenameProjectDialog
        open={actions.dialog === "rename"}
        project={actions.targetProject}
        name={actions.renameName}
        loading={actions.loading}
        onNameChange={actions.setRenameName}
        onConfirm={actions.handleRename}
        onClose={actions.close}
      />
      <DeleteProjectDialog
        open={actions.dialog === "delete"}
        project={actions.targetProject}
        loading={actions.loading}
        onConfirm={actions.handleDelete}
        onClose={actions.close}
      />
    </ProjectDialogsContext.Provider>
  )
}
