"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toSlug } from "@/hooks/use-project-dialogs"

interface CreateProjectDialogProps {
  open: boolean
  name: string
  loading: boolean
  onNameChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function CreateProjectDialog({
  open,
  name,
  loading,
  onNameChange,
  onConfirm,
  onClose,
}: CreateProjectDialogProps) {
  const slug = toSlug(name)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl bg-elevated border-border-default sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">New Project</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && name.trim() && slug) onConfirm()
            }}            autoFocus
            className="bg-subtle border-border-default text-copy-primary placeholder:text-copy-faint"
          />
          <p className="text-xs text-copy-muted font-mono">
            {slug ? (
              <>
                <span className="text-copy-faint">ghost.ai/</span>
                <span className="text-copy-secondary">{slug}</span>
              </>
            ) : (
              <span className="text-copy-faint">ghost.ai/your-project-slug</span>
            )}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!name.trim() || !slug || loading}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
