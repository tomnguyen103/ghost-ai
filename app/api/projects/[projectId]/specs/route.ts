import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIdentity } from "@/lib/project-access";

type Params = Promise<{ projectId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = project.ownerId === identity.userId;
    if (!isOwner) {
      const collab = await prisma.projectCollaborator.findFirst({
        where: { projectId: project.id, email: identity.email ?? "" },
        select: { id: true },
      });
      if (!collab) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const specs = await prisma.projectSpec.findMany({
      where: { projectId: project.id },
      select: { id: true, filePath: true, creatorId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ specs });
  } catch (err) {
    console.error("[specs] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
