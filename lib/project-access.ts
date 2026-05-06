import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export interface ClerkIdentity {
  userId: string
  email: string | null
}

export async function getIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress.toLowerCase() ?? null

  return { userId, email }
}

export async function getProjectAccess(
  slug: string,
  userId: string,
  email: string | null
): Promise<{ id: string; name: string; slug: string; ownerId: string } | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, ownerId: true },
  })
  if (!project) return null
  if (project.ownerId === userId) return project
  if (!email) return null
  const collab = await prisma.projectCollaborator.findFirst({
    where: { projectId: project.id, email },
    select: { id: true },
  })
  return collab ? project : null
}
