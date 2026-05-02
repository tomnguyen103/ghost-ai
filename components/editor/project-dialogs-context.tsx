"use client"

import { createContext, useContext } from "react"
import type { ProjectDialogsHook } from "@/hooks/use-project-dialogs"

export const ProjectDialogsContext = createContext<ProjectDialogsHook | null>(null)

export function useProjectDialogsContext(): ProjectDialogsHook {
  const ctx = useContext(ProjectDialogsContext)
  if (!ctx) {
    throw new Error("useProjectDialogsContext must be used inside ProjectDialogsContext.Provider")
  }
  return ctx
}
