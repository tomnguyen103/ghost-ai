"use client"

import { useState } from "react"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"

interface EditorShellProps {
  children: React.ReactNode
}

export function EditorShell({ children }: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex flex-1 flex-col pt-12 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
