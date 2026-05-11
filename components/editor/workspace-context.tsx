"use client"

import { createContext, useContext, useRef, type MutableRefObject } from "react"
import type { SaveStatus } from "@/hooks/use-autosave"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

interface WorkspaceProject {
  id: string
  name: string
  slug: string
}

export interface AiStatusMessage {
  status: string
  step: "start" | "processing" | "complete" | "error"
  text?: string
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
  // Ref to latest canvas snapshot for spec generation — set by CanvasInner
  canvasSnapshotRef: MutableRefObject<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>
  // Latest broadcast from the ai-status-feed
  aiStatusMessage: AiStatusMessage | null
  setAiStatusMessage: (msg: AiStatusMessage | null) => void
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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  canvasSnapshotRef: { current: { nodes: [], edges: [] } },
  aiStatusMessage: null,
  setAiStatusMessage: () => {},
})

export const useWorkspace = () => useContext(WorkspaceContext)
