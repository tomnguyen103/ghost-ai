"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ShareProject {
  id: string
  name: string
}

interface Collaborator {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
}

interface ShareResponse {
  access: {
    role: "owner" | "collaborator"
    canManage: boolean
  }
  collaborators: Collaborator[]
}

interface ShareDialogProps {
  open: boolean
  project: ShareProject
  onOpenChange: (open: boolean) => void
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function collaboratorInitial(collaborator: Collaborator): string {
  const source = collaborator.displayName ?? collaborator.email
  return source.slice(0, 1).toUpperCase()
}

export function ShareDialog({ open, project, onOpenChange }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [canManage, setCanManage] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const projectLink = useMemo(() => {
    if (typeof window === "undefined") return `/editor/${project.id}`
    return `${window.location.origin}/editor/${project.id}`
  }, [project.id])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    fetch(`/api/projects/${project.id}/collaborators`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load collaborators")
        return (await response.json()) as ShareResponse
      })
      .then((data) => {
        if (cancelled) return
        setCollaborators(data.collaborators)
        setCanManage(data.access.canManage)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load collaborators"))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, project.id])

  useEffect(() => {
    if (!copied) return

    const timeout = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timeout)
  }, [copied])

  function handleInvite() {
    const trimmed = email.trim()
    if (!trimmed || saving) return

    setSaving(true)
    setError(null)
    fetch(`/api/projects/${project.id}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? "Failed to invite collaborator")
        }
        return (await response.json()) as { collaborators: Collaborator[] }
      })
      .then((data) => {
        setCollaborators(data.collaborators)
        setEmail("")
      })
      .catch((err) => setError(getErrorMessage(err, "Failed to invite collaborator")))
      .finally(() => setSaving(false))
  }

  function handleRemove(collaboratorId: string) {
    if (removingId) return

    setRemovingId(collaboratorId)
    setError(null)
    fetch(`/api/projects/${project.id}/collaborators`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaboratorId }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to remove collaborator")
        setCollaborators((current) =>
          current.filter((collaborator) => collaborator.id !== collaboratorId)
        )
      })
      .catch((err) => setError(getErrorMessage(err, "Failed to remove collaborator")))
      .finally(() => setRemovingId(null))
  }

  function handleCopyLink() {
    navigator.clipboard
      .writeText(projectLink)
      .then(() => setCopied(true))
      .catch(() => setError("Failed to copy project link"))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border-default bg-elevated sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Share Project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {canManage && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleInvite()
                  }}
                  placeholder="name@example.com"
                  disabled={saving}
                  className="bg-subtle border-border-default text-copy-primary placeholder:text-copy-faint"
                />
                <Button
                  onClick={handleInvite}
                  disabled={!email.trim() || saving}
                  className="shrink-0 gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Invite
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="justify-start gap-2 text-copy-secondary"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy project link"}
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium uppercase text-copy-faint">
              Collaborators
            </div>

            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border-default bg-surface px-3 py-3 text-sm text-copy-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading collaborators
              </div>
            ) : collaborators.length === 0 ? (
              <div className="rounded-2xl border border-border-default bg-surface px-3 py-4 text-sm text-copy-muted">
                No collaborators yet.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-border-default bg-surface">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-3 border-b border-border-default px-3 py-3 last:border-b-0"
                  >
                    {collaborator.avatarUrl ? (
                      <div
                        aria-hidden="true"
                        className="h-9 w-9 rounded-xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${collaborator.avatarUrl})` }}
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-subtle text-sm font-medium text-copy-secondary">
                        {collaboratorInitial(collaborator)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-copy-primary">
                        {collaborator.displayName ?? collaborator.email}
                      </div>
                      {collaborator.displayName && (
                        <div className="truncate text-xs text-copy-muted">
                          {collaborator.email}
                        </div>
                      )}
                    </div>

                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(collaborator.id)}
                        disabled={removingId === collaborator.id}
                        className="h-8 w-8 shrink-0 text-copy-muted hover:text-error"
                        aria-label={`Remove ${collaborator.email}`}
                      >
                        {removingId === collaborator.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-error">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
