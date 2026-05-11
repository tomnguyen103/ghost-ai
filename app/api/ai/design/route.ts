import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import type { designAgent } from "@/trigger/design-agent";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let prompt: string;
    let roomId: string;
    let projectId: string;
    try {
      const body = await request.json();
      if (typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
        return NextResponse.json({ error: "prompt is required" }, { status: 400 });
      }
      if (typeof body.roomId !== "string" || body.roomId.trim().length === 0) {
        return NextResponse.json({ error: "roomId is required" }, { status: 400 });
      }
      if (typeof body.projectId !== "string" || body.projectId.trim().length === 0) {
        return NextResponse.json({ error: "projectId is required" }, { status: 400 });
      }
      prompt = body.prompt.trim();
      roomId = body.roomId.trim();
      projectId = body.projectId.trim();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let handle: { id: string };
    try {
      handle = await tasks.trigger<typeof designAgent>("design-agent", { prompt, roomId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ai/design] tasks.trigger failed:", msg);
      // Trigger.dev dev server not running or misconfigured
      return NextResponse.json(
        { error: "AI service unavailable. Make sure the Trigger.dev dev server is running (`npx trigger.dev@latest dev`)." },
        { status: 503 }
      );
    }

    try {
      await prisma.taskRun.create({
        data: { runId: handle.id, projectId, userId },
      });
    } catch (err) {
      // Non-fatal: token fetch will fail but the task is already running
      console.error("[ai/design] taskRun.create failed:", err);
    }

    return NextResponse.json({ runId: handle.id }, { status: 201 });
  } catch (err) {
    console.error("[ai/design] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
