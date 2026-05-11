"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjectDialogsContext } from "./project-dialogs-context"

export function NewProjectButton() {
  const { openCreate } = useProjectDialogsContext()
  return (
    <Button onClick={openCreate} className="gap-2 mt-2">
      <Plus className="h-5 w-5" />
      New Project
    </Button>
  )
}
