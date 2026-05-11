import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { put, get } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getIdentity } from "@/lib/project-access"

type Params = Promise<{ projectId: string }>

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  })
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isOwner = project.ownerId === userId
  if (!isOwner) {
    const identity = await getIdentity()
    const collab = identity?.email
      ? await prisma.projectCollaborator.findFirst({
          where: { projectId: project.id, email: identity.email },
          select: { id: true },
        })
      : null
    if (!collab) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  let canvasJson: unknown
  try {
    canvasJson = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    const blob = await put(
      `canvas/${projectId}.json`,
      JSON.stringify(canvasJson),
      { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true }
    )

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasBlobUrl: blob.url },
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error("[canvas PUT] blob/db error:", err)
    return NextResponse.json({ error: "Save failed" }, { status: 500 })
  }
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true, canvasBlobUrl: true },
  })
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isOwner = project.ownerId === identity.userId
  if (!isOwner) {
    const collab = await prisma.projectCollaborator.findFirst({
      where: { projectId: project.id, email: identity.email ?? "" },
      select: { id: true },
    })
    if (!collab) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  if (!project.canvasBlobUrl) {
    return NextResponse.json({ canvas: null })
  }

  const blobResult = await get(project.canvasBlobUrl, { access: "private" })
  if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
    return NextResponse.json({ error: "Failed to fetch canvas" }, { status: 502 })
  }

  const text = await new Response(blobResult.stream).text()
  const canvas = JSON.parse(text)
  return NextResponse.json({ canvas })
}
