"use client"

import { useState } from "react"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { ProjectDialogsContext } from "./project-dialogs-context"
import { CreateProjectDialog } from "./create-project-dialog"
import { RenameProjectDialog } from "./rename-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

interface EditorShellProps {
  children: React.ReactNode
}

export function EditorShell({ children }: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dialogs = useProjectDialogs()

  return (
    <ProjectDialogsContext.Provider value={dialogs}>
      <div className="flex h-screen flex-col bg-base">
        <EditorNavbar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex flex-1 flex-col pt-12 overflow-hidden">
          {children}
        </main>
      </div>

      <CreateProjectDialog
        open={dialogs.dialog === "create"}
        name={dialogs.createName}
        loading={dialogs.loading}
        onNameChange={dialogs.setCreateName}
        onConfirm={dialogs.handleCreate}
        onClose={dialogs.close}
      />
      <RenameProjectDialog
        open={dialogs.dialog === "rename"}
        project={dialogs.targetProject}
        name={dialogs.renameName}
        loading={dialogs.loading}
        onNameChange={dialogs.setRenameName}
        onConfirm={dialogs.handleRename}
        onClose={dialogs.close}
      />
      <DeleteProjectDialog
        open={dialogs.dialog === "delete"}
        project={dialogs.targetProject}
        loading={dialogs.loading}
        onConfirm={dialogs.handleDelete}
        onClose={dialogs.close}
      />
    </ProjectDialogsContext.Provider>
  )
}
