import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getIdentity } from "@/lib/project-access";
import { getLiveblocksClient } from "@/lib/liveblocks";

type Params = Promise<{ projectId: string; specId: string }>;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, specId } = await params;

    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
      select: { id: true, projectId: true, creatorId: true, filePath: true, project: { select: { slug: true } } },
    });

    if (!spec || spec.projectId !== projectId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (spec.creatorId !== identity.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      await del(spec.filePath);
    } catch (err) {
      console.warn("[specs/delete] blob delete failed (continuing):", err);
    }

    await prisma.projectSpec.delete({ where: { id: specId } });

    // Notify all clients in the room so their spec lists update in real time.
    try {
      const liveblocks = getLiveblocksClient();
      await liveblocks.broadcastEvent(spec.project.slug, { type: "spec-deleted", specId });
    } catch {
      // Non-fatal: collaborators will see the deletion on their next refresh.
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[specs/delete] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
