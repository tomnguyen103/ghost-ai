"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toSlug } from "@/lib/utils"
import type { SidebarProject } from "@/lib/projects"

interface RenameProjectDialogProps {
  open: boolean
  project: SidebarProject | null
  name: string
  loading: boolean
  error?: string | null
  onNameChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function RenameProjectDialog({
  open,
  project,
  name,
  loading,
  error,
  onNameChange,
  onConfirm,
  onClose,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl bg-elevated border-border-default sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Rename Project</DialogTitle>
          {project && (
            <DialogDescription className="text-copy-muted">
              Renaming &ldquo;{project.name}&rdquo;
            </DialogDescription>
          )}
        </DialogHeader>

        <Input
          autoFocus
          placeholder="Project name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim() && toSlug(name) && !loading) onConfirm()
          }}
          className="bg-subtle border-border-default text-copy-primary placeholder:text-copy-faint"
        />

        {error && (
          <p className="text-xs text-error">{error}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!name.trim() || !toSlug(name) || loading}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
