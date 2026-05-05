"use client"

import Link from "next/link"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useProjectDialogsContext } from "./project-dialogs-context"
import { useWorkspace } from "./workspace-context"
import type { SidebarProject } from "@/lib/projects"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: SidebarProject[]
  sharedProjects: SidebarProject[]
}

function ProjectItem({
  project,
  showActions,
}: {
  project: SidebarProject
  showActions: boolean
}) {
  const { openRename, openDelete } = useProjectDialogsContext()
  const { workspaceProject } = useWorkspace()
  const isActive = workspaceProject?.id === project.id

  return (
    <Link
      href={`/editor/${project.id}`}
      className={cn(
        "group flex items-center justify-between rounded-xl px-3 py-2 transition-colors",
        isActive
          ? "bg-brand-dim text-copy-primary"
          : "hover:bg-subtle text-copy-secondary cursor-pointer"
      )}
    >
      <span className="text-sm truncate flex-1">{project.name}</span>
      {showActions && (
        <div className="flex items-center gap-0.5 shrink-0 ml-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-copy-muted hover:text-copy-primary"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openRename(project)
            }}
            aria-label={`Rename ${project.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-copy-muted hover:text-error"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openDelete(project)
            }}
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Link>
  )
}

export function ProjectSidebar({ isOpen, onClose, ownedProjects, sharedProjects }: ProjectSidebarProps) {
  const { openCreate } = useProjectDialogsContext()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-base/70 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-12 bottom-0 z-30 flex w-72 flex-col border-r border-border-default bg-elevated transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
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

            <TabsContent value="my-projects" className="flex flex-1 flex-col mt-2 overflow-hidden">
              {ownedProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-copy-muted">No projects yet.</p>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-0.5">
                    {ownedProjects.map((project) => (
                      <ProjectItem key={project.id} project={project} showActions />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex flex-1 flex-col mt-2 overflow-hidden">
              {sharedProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-copy-muted">No shared projects.</p>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-0.5">
                    {sharedProjects.map((project) => (
                      <ProjectItem key={project.id} project={project} showActions={false} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border-default px-3 py-3">
          <Button className="w-full gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
