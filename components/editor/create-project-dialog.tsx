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
import { toSlug } from "@/hooks/use-project-actions"

interface CreateProjectDialogProps {
  open: boolean
  name: string
  roomId: string
  loading: boolean
  onNameChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function CreateProjectDialog({
  open,
  name,
  roomId,
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
            autoFocus
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && name.trim() && slug) onConfirm()
            }}
            className="bg-subtle border-border-default text-copy-primary placeholder:text-copy-faint"
          />
          <p className="text-xs font-mono text-copy-muted">
            {roomId ? (
              <>
                <span className="text-copy-faint">Room: </span>
                <span className="text-copy-secondary">{roomId}</span>
              </>
            ) : (
              <span className="text-copy-faint">Room: your-project-name-abc123</span>
            )}
          </p>
        </div>

        <DialogFooter>
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
