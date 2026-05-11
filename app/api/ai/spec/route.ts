import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getIdentity, getProjectAccess } from "@/lib/project-access";
import { tasks } from "@trigger.dev/sdk/v3";
import type { generateSpec } from "@/trigger/generate-spec";

const BodySchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  nodes: z.array(z.record(z.string(), z.unknown())),
  edges: z.array(z.record(z.string(), z.unknown())),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: z.infer<typeof BodySchema>;
    try {
      const raw = await request.json();
      const result = BodySchema.safeParse(raw);
      if (!result.success) {
        return NextResponse.json({ error: result.error.issues[0]?.message ?? "Invalid request body" }, { status: 400 });
      }
      body = result.data;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { roomId, chatHistory, nodes, edges } = body;

    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await getProjectAccess(roomId, identity.userId, identity.email);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let handle: { id: string };
    try {
      handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
        projectId: project.id,
        roomId,
        creatorId: userId,
        chatHistory,
        nodes,
        edges,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ai/spec] tasks.trigger failed:", msg);
      return NextResponse.json(
        { error: "AI service unavailable. Make sure the Trigger.dev dev server is running (`npx trigger.dev@latest dev`)." },
        { status: 503 }
      );
    }

    try {
      await prisma.taskRun.create({
        data: { runId: handle.id, projectId: project.id, userId },
      });
    } catch (err) {
      console.error("[ai/spec] taskRun.create failed:", err);
    }

    return NextResponse.json({ runId: handle.id }, { status: 201 });
  } catch (err) {
    console.error("[ai/spec] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
