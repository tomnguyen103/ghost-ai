import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getIdentity } from "@/lib/project-access";

type Params = Promise<{ projectId: string; specId: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, specId } = await params;

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

    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
      select: { id: true, projectId: true, filePath: true },
    });
    if (!spec || spec.projectId !== projectId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const blobResult = await get(spec.filePath, { access: "private" });
    if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
      return NextResponse.json({ error: "Failed to fetch spec" }, { status: 502 });
    }

    const content = await new Response(blobResult.stream).text();

    return new NextResponse(content, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[specs/preview] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
