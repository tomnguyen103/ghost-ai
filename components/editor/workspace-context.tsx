"use client"

import { createContext, useContext, useRef, type MutableRefObject } from "react"
import type { SaveStatus } from "@/hooks/use-autosave"

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
  saveStatus: SaveStatus
  setSaveStatus: (status: SaveStatus) => void
  // Ref to the latest manualSave function — always current, no stale closure
  manualSaveRef: MutableRefObject<(() => void) | null>
}

export const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceProject: null,
  setWorkspaceProject: () => {},
  aiSidebarOpen: false,
  setAiSidebarOpen: () => {},
  templatesOpen: false,
  setTemplatesOpen: () => {},
  saveStatus: "idle",
  setSaveStatus: () => {},
  // eslint-disable-next-line react-hooks/rules-of-hooks
  manualSaveRef: { current: null },
})

export const useWorkspace = () => useContext(WorkspaceContext)
