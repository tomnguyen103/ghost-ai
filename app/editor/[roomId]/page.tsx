import { redirect } from "next/navigation"
import { getIdentity, getProjectAccess } from "@/lib/project-access"
import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceShell } from "@/components/editor/workspace-shell"

type Params = Promise<{ roomId: string }>

export default async function WorkspacePage({ params }: { params: Params }) {
  const { roomId } = await params

  const identity = await getIdentity()
  if (!identity) redirect("/sign-in")

  const project = await getProjectAccess(roomId, identity.userId, identity.email)
  if (!project) return <AccessDenied />

  return <WorkspaceShell project={project} />
}
