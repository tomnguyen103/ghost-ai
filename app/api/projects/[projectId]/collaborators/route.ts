import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import {
  enrichCollaborators,
  isValidCollaboratorEmail,
  normalizeCollaboratorEmail,
} from "@/lib/project-collaborators"
import { getIdentity, getProjectAccess } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

type Params = Promise<{ projectId: string }>

async function getCollaboratorList(projectId: string) {
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, createdAt: true },
  })

  return enrichCollaborators(collaborators)
}

async function getOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  })

  if (!project) return { project: null, response: NextResponse.json({ error: "Not found" }, { status: 404 }) }
  if (project.ownerId !== userId) {
    return { project: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { project, response: null }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const identity = await getIdentity()
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const project = await getProjectAccess(projectId, identity.userId, identity.email)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const role = project.ownerId === identity.userId ? "owner" : "collaborator"
  const collaborators = await getCollaboratorList(projectId)

  return NextResponse.json({
    project: { id: project.id, name: project.name },
    access: { role, canManage: role === "owner" },
    collaborators,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const ownership = await getOwnedProject(projectId, userId)
  if (ownership.response) return ownership.response

  let email: string
  try {
    const body = await request.json()
    if (typeof body.email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 })
    }

    email = normalizeCollaboratorEmail(body.email)
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!isValidCollaboratorEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
  }

  await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    update: {},
    create: { projectId, email },
  })

  const collaborators = await getCollaboratorList(projectId)
  return NextResponse.json({ collaborators }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const ownership = await getOwnedProject(projectId, userId)
  if (ownership.response) return ownership.response

  let collaboratorId: string
  try {
    const body = await request.json()
    if (typeof body.collaboratorId !== "string" || body.collaboratorId.trim().length === 0) {
      return NextResponse.json({ error: "collaboratorId is required" }, { status: 400 })
    }

    collaboratorId = body.collaboratorId.trim()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const collaborator = await prisma.projectCollaborator.findFirst({
    where: { id: collaboratorId, projectId },
    select: { id: true },
  })

  if (!collaborator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.projectCollaborator.delete({ where: { id: collaboratorId } })

  return new NextResponse(null, { status: 204 })
}
