"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { SidebarProject } from "@/lib/projects"

type DialogType = "create" | "rename" | "delete" | null

export interface ProjectActionsHook {
  dialog: DialogType
  targetProject: SidebarProject | null
  createName: string
  createRoomId: string
  renameName: string
  loading: boolean
  error: string | null
  openCreate: () => void
  openRename: (project: SidebarProject) => void
  openDelete: (project: SidebarProject) => void
  close: () => void
  setCreateName: (value: string) => void
  setRenameName: (value: string) => void
  handleCreate: () => void
  handleRename: () => void
  handleDelete: () => void
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function useProjectActions(): ProjectActionsHook {
  const router = useRouter()
  const pathname = usePathname()

  const [dialog, setDialog] = useState<DialogType>(null)
  const [targetProject, setTargetProject] = useState<SidebarProject | null>(null)
  const [createName, setCreateName] = useState("")
  const [renameName, setRenameName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoomId = toSlug(createName)

  function openCreate() {
    setCreateName("")
    setDialog("create")
  }

  function openRename(project: SidebarProject) {
    setTargetProject(project)
    setRenameName(project.name)
    setDialog("rename")
  }

  function openDelete(project: SidebarProject) {
    setTargetProject(project)
    setDialog("delete")
  }

  function close() {
    setDialog(null)
    setTargetProject(null)
    setCreateName("")
    setRenameName("")
    setError(null)
  }

  function handleCreate() {
    const trimmed = createName.trim()
    if (!trimmed) return

    const roomId = toSlug(trimmed)
    if (!roomId) return

     setLoading(true)
     fetch("/api/projects", {
       method: "POST",
       headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ name: trimmed }),
     })
       .then((res) => {
         if (!res.ok) throw new Error("Failed to create project")
         return res.json()
       })

      .then(({ project }) => {
         close()

        router.push(`/editor/${project.id}`)
       })
      .catch((err) => setError(err instanceof Error ? err.message : "An error occurred"))
      .finally(() => setLoading(false))
  }

  function handleRename() {
    const trimmed = renameName.trim()
    if (!trimmed || !targetProject) return

    setLoading(true)
    setError(null)
    fetch(`/api/projects/${targetProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to rename project")
        close()
        router.refresh()
      })
      .catch((err) => setError(err instanceof Error ? err.message : "An error occurred"))
      .finally(() => setLoading(false))
  }

  function handleDelete() {
    if (!targetProject) return
    const isActive = pathname === `/editor/${targetProject.id}`

    setLoading(true)
    setError(null)
    fetch(`/api/projects/${targetProject.id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete project")
        close()
        if (isActive) {
          router.push("/editor")
        } else {
          router.refresh()
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "An error occurred"))
      .finally(() => setLoading(false))
  }

  return {
    dialog,
    targetProject,
    createName,
    createRoomId,
    renameName,
    loading,
    error,
    openCreate,
    openRename,
    openDelete,
    close,
    setCreateName,
    setRenameName,
    handleCreate,
    handleRename,
    handleDelete,
  }
}
