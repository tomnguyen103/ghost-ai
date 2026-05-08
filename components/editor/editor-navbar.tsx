"use client"

import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen, Share2, Bot, LayoutTemplate, Save, Loader2, CheckCheck } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWorkspace } from "./workspace-context"
import { ShareDialog } from "./share-dialog"

interface EditorNavbarProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

function SaveIcon({ saveStatus }: { saveStatus: import("@/hooks/use-autosave").SaveStatus }) {
  if (saveStatus === "saving") return <Loader2 className="h-3.5 w-3.5 animate-spin" />
  if (saveStatus === "saved") return <CheckCheck className="h-3.5 w-3.5" />
  return <Save className="h-3.5 w-3.5" />
}

function saveLabel(saveStatus: import("@/hooks/use-autosave").SaveStatus) {
  if (saveStatus === "saving") return "Saving..."
  if (saveStatus === "saved") return "Saved"
  if (saveStatus === "error") return "Error"
  return "Save"
}

export function EditorNavbar({ isOpen, onToggle, className }: EditorNavbarProps) {
  const { workspaceProject, aiSidebarOpen, setAiSidebarOpen, setTemplatesOpen, saveStatus, manualSaveRef } = useWorkspace()
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <>
      <header
        className={cn(
          "flex h-12 shrink-0 items-center border-b border-border-default bg-surface px-3",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-copy-muted hover:text-copy-primary"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
          {workspaceProject && (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-medium text-copy-primary">
                {workspaceProject.name}
              </span>
              <span className="text-[10px] text-copy-faint">Workspace</span>
            </div>
          )}
        </div>

        <div className="flex flex-1" />

        <div className="flex items-center gap-1.5">
          {workspaceProject && (
            <>
              {/* Save button — pill with icon + label */}
              <button
                onClick={() => manualSaveRef.current?.()}
                disabled={saveStatus === "saving"}
                title={saveLabel(saveStatus)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all disabled:opacity-60",
                  saveStatus === "saved"
                    ? "border-success/40 bg-success/10 text-success"
                    : saveStatus === "error"
                    ? "border-error/40 bg-error/10 text-error"
                    : "border-border-default bg-elevated text-copy-secondary hover:border-brand/40 hover:bg-brand-dim hover:text-brand"
                )}
              >
                <SaveIcon saveStatus={saveStatus} />
                {saveLabel(saveStatus)}
              </button>

              {/* Templates */}
              <button
                onClick={() => setTemplatesOpen(true)}
                title="Templates"
                className="flex h-8 items-center gap-1.5 rounded-full border border-border-default bg-elevated px-3 text-xs font-medium text-copy-muted transition-all hover:border-brand/40 hover:bg-brand-dim hover:text-brand"
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                Templates
              </button>

              {/* Share */}
              <button
                onClick={() => setShareOpen(true)}
                title="Share"
                className="flex h-8 items-center gap-1.5 rounded-full border border-border-default bg-elevated px-3 text-xs font-medium text-copy-muted transition-all hover:border-brand/40 hover:bg-brand-dim hover:text-brand"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>

              {/* AI sidebar toggle */}
              <button
                onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
                title="Toggle AI"
                aria-label="Toggle AI sidebar"
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                  aiSidebarOpen
                    ? "border-ai/40 bg-ai/10 text-ai"
                    : "border-border-default bg-elevated text-copy-muted hover:border-ai/40 hover:bg-ai/10 hover:text-ai"
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                AI
              </button>
            </>
          )}
          <UserButton />
        </div>
      </header>

      {shareOpen && workspaceProject && (
        <ShareDialog
          key={workspaceProject.id}
          open={shareOpen}
          project={workspaceProject}
          onOpenChange={setShareOpen}
        />
      )}
    </>
  )
}
