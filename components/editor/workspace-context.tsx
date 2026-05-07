"use client"

import { createContext, useContext } from "react"

interface WorkspaceProject {
  id: string
  name: string
  slug: string
}

interface WorkspaceContextValue {
  workspaceProject: WorkspaceProject | null
  setWorkspaceProject: (project: WorkspaceProject | null) => void
  aiSidebarOpen: boolean
  setAiSidebarOpen: (open: boolean) => void
  templatesOpen: boolean
  setTemplatesOpen: (open: boolean) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceProject: null,
  setWorkspaceProject: () => {},
  aiSidebarOpen: false,
  setAiSidebarOpen: () => {},
  templatesOpen: false,
  setTemplatesOpen: () => {},
})

export const useWorkspace = () => useContext(WorkspaceContext)
