"use client"

import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen, Share2, Bot } from "lucide-react"
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

export function EditorNavbar({ isOpen, onToggle, className }: EditorNavbarProps) {
  const { workspaceProject, aiSidebarOpen, setAiSidebarOpen } = useWorkspace()
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

        <div className="flex items-center gap-1">
          {workspaceProject && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareOpen(true)}
                className="h-8 gap-1.5 text-copy-muted hover:text-copy-primary"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs">Share</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
                className={cn(
                  "h-8 gap-1.5",
                  aiSidebarOpen
                    ? "text-ai bg-ai/10"
                    : "text-copy-muted hover:text-copy-primary"
                )}
                aria-label="Toggle AI sidebar"
              >
                <Bot className="h-4 w-4" />
                <span className="text-xs">AI</span>
              </Button>
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
