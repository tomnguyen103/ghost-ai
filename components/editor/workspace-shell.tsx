"use client"

import { useEffect } from "react"
import { Bot, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWorkspace } from "./workspace-context"
import { CanvasRoom } from "./canvas-room"

interface WorkspaceShellProps {
  project: { id: string; name: string; slug: string }
}

export function WorkspaceShell({ project }: WorkspaceShellProps) {
  const { setWorkspaceProject, aiSidebarOpen, setAiSidebarOpen } = useWorkspace()

  useEffect(() => {
    setWorkspaceProject({ id: project.id, name: project.name, slug: project.slug })
    setAiSidebarOpen(true)
    return () => {
      setWorkspaceProject(null)
    }
  }, [project.id, project.name, project.slug, setWorkspaceProject, setAiSidebarOpen])

  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full">
        <CanvasRoom roomId={project.slug} />
      </div>

      <aside
        className={cn(
          "absolute right-0 top-0 bottom-0 z-30 flex w-80 flex-col border-l border-border-default bg-elevated shadow-xl overflow-hidden transition-transform duration-200",
          aiSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold text-copy-primary">AI Copilot</span>
              <span className="text-[10px] text-copy-faint">Placeholder panel</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-copy-muted hover:text-copy-primary"
              aria-label="AI settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            <div className="rounded-xl border border-border-default bg-surface p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ai/10">
                  <Bot className="h-4 w-4 text-ai" />
                </div>
                <div>
                  <p className="text-xs font-medium text-copy-primary">Chat surface pending</p>
                  <p className="mt-1 text-xs leading-relaxed text-copy-muted">
                    The AI chat interface will appear here. Connect nodes, ask questions, and get diagram suggestions.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border-default bg-surface p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-copy-faint">
                Future Hooks
              </p>
              <p className="text-xs leading-relaxed text-copy-muted">
                Planned integrations: diagram analysis, auto-layout suggestions, and context-aware tooling will live here.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
