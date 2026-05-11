import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth as triggerAuth } from "@trigger.dev/sdk/v3";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let runId: string;
    try {
      const body = await request.json();
      if (typeof body.runId !== "string" || body.runId.trim().length === 0) {
        return NextResponse.json({ error: "runId is required" }, { status: 400 });
      }
      runId = body.runId.trim();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const taskRun = await prisma.taskRun.findUnique({ where: { runId } });
    if (!taskRun || taskRun.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let publicToken: string;
    try {
      publicToken = await triggerAuth.createPublicToken({
        scopes: { read: { runs: [runId] } },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ai/design/token] createPublicToken failed:", msg);
      return NextResponse.json(
        { error: "Could not create public token" },
        { status: 503 }
      );
    }

    return NextResponse.json({ token: publicToken });
  } catch (err) {
    console.error("[ai/design/token] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
