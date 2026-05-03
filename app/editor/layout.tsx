import { getProjectsForSidebar } from "@/lib/projects"
import { EditorShell } from "@/components/editor/editor-shell"

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { owned, shared } = await getProjectsForSidebar()
  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      {children}
    </EditorShell>
  )
}
