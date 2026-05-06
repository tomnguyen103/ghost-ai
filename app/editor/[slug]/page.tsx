import { redirect } from "next/navigation"
import { getIdentity, getProjectAccess } from "@/lib/project-access"
import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceShell } from "@/components/editor/workspace-shell"

type Params = Promise<{ slug: string }>

export default async function WorkspacePage({ params }: { params: Params }) {
  const { slug } = await params

  const identity = await getIdentity()
  if (!identity) redirect("/sign-in")

  const project = await getProjectAccess(slug, identity.userId, identity.email)
  if (!project) return <AccessDenied />

  return <WorkspaceShell project={project} />
}
