import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export interface SidebarProject {
  id: string
  name: string
}

export async function getProjectsForSidebar(): Promise<{
  owned: SidebarProject[]
  shared: SidebarProject[]
}> {
  const { userId } = await auth()
  if (!userId) return { owned: [], shared: [] }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress.toLowerCase()

  const owned = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  })

  const shared: SidebarProject[] = email
    ? (
        await prisma.projectCollaborator.findMany({
          where: { email },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        })
      ).map((c) => c.project)
    : []

  return { owned, shared }
}
