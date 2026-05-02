"use client"

import { useState } from "react"

export interface MockProject {
  id: string
  name: string
  slug: string
  isOwner: boolean
}

const INITIAL_PROJECTS: MockProject[] = [
  { id: "1", name: "E-commerce Platform", slug: "e-commerce-platform", isOwner: true },
  { id: "2", name: "Auth Service", slug: "auth-service", isOwner: true },
  { id: "3", name: "Shared Design System", slug: "shared-design-system", isOwner: false },
]

type DialogType = "create" | "rename" | "delete" | null

export interface ProjectDialogsHook {
  projects: MockProject[]
  dialog: DialogType
  targetProject: MockProject | null
  createName: string
  renameName: string
  loading: boolean
  openCreate: () => void
  openRename: (project: MockProject) => void
  openDelete: (project: MockProject) => void
  close: () => void
  setCreateName: (name: string) => void
  setRenameName: (name: string) => void
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

export function useProjectDialogs(): ProjectDialogsHook {
  const [projects, setProjects] = useState<MockProject[]>(INITIAL_PROJECTS)
  const [dialog, setDialog] = useState<DialogType>(null)
  const [targetProject, setTargetProject] = useState<MockProject | null>(null)
  const [createName, setCreateName] = useState("")
  const [renameName, setRenameName] = useState("")
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setCreateName("")
    setDialog("create")
  }

  function openRename(project: MockProject) {
    setTargetProject(project)
    setRenameName(project.name)
    setDialog("rename")
  }

  function openDelete(project: MockProject) {
    setTargetProject(project)
    setDialog("delete")
  }

  function close() {
    setDialog(null)
    setTargetProject(null)
    setCreateName("")
    setRenameName("")
  }

  function handleCreate() {
    const trimmed = createName.trim()
    if (!trimmed) return
    setLoading(true)
    setProjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name: trimmed, slug: toSlug(trimmed), isOwner: true },
    ])
    setLoading(false)
    close()
  }

  function handleRename() {
    const trimmed = renameName.trim()
    if (!trimmed || !targetProject) return
    setLoading(true)
    setProjects((prev) =>
      prev.map((p) =>
        p.id === targetProject.id
          ? { ...p, name: trimmed, slug: toSlug(trimmed) }
          : p
      )
    )
    setLoading(false)
    close()
  }

  function handleDelete() {
    if (!targetProject) return
    setLoading(true)
    setProjects((prev) => prev.filter((p) => p.id !== targetProject.id))
    setLoading(false)
    close()
  }

  return {
    projects,
    dialog,
    targetProject,
    createName,
    renameName,
    loading,
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
