"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ProjectSidebar({ isOpen, onClose, className }: ProjectSidebarProps) {
  return (
    <aside
      id="project-sidebar"
      aria-hidden={!isOpen}
      className={cn(
        "fixed left-0 top-12 bottom-0 z-30 flex w-72 flex-col border-r border-border-default bg-elevated transition-transform duration-200",
        isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <span className="text-sm font-semibold text-copy-primary">Projects</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-copy-muted hover:text-copy-primary"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden px-3 py-3">
        <Tabs defaultValue="my-projects" className="flex flex-1 flex-col">
          <TabsList className="w-full bg-subtle">
            <TabsTrigger value="my-projects" className="flex-1 text-xs">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1 text-xs">
              Shared
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="my-projects"
            className="flex flex-1 items-center justify-center"
          >
            <p className="text-sm text-copy-muted">No projects yet.</p>
          </TabsContent>
          <TabsContent
            value="shared"
            className="flex flex-1 items-center justify-center"
          >
            <p className="text-sm text-copy-muted">No shared projects.</p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-border-default px-3 py-3">
        <Button className="w-full gap-2" variant="default">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  )
}
