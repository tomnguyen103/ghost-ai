"use client"

import { createContext, useContext } from "react"
import type { ProjectActionsHook } from "@/hooks/use-project-actions"

export const ProjectDialogsContext = createContext<ProjectActionsHook | null>(null)

export function useProjectDialogsContext(): ProjectActionsHook {
  const ctx = useContext(ProjectDialogsContext)
  if (!ctx) {
    throw new Error("useProjectDialogsContext must be used inside ProjectDialogsContext.Provider")
  }
  return ctx
}
