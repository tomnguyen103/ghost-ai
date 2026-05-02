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
import type { MockProject } from "@/hooks/use-project-dialogs"

interface DeleteProjectDialogProps {
  open: boolean
  project: MockProject | null
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeleteProjectDialog({
  open,
  project,
  loading,
  onConfirm,
  onClose,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl bg-elevated border-border-default sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Delete Project</DialogTitle>
          {project && (
            <DialogDescription className="text-copy-muted">
              &ldquo;{project.name}&rdquo; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
