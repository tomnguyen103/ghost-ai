import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/utils";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let name = "Untitled Project";
  let id: string | undefined;
  try {
    const body = await request.json();
    if (typeof body.name === "string" && body.name.trim().length > 0) {
      name = body.name.trim();
    }
    if (typeof body.id === "string" && body.id.trim().length > 0) {
      id = body.id.trim();
    }
  } catch {
    // empty or non-JSON body — use defaults
  }

  // When the client provides an id (the generated room ID), use it as both
  // the project id and the slug so they stay aligned per spec.
  const slug = id ?? `${toSlug(name) || "project"}-${Date.now().toString(36)}`;

  const project = await prisma.project.create({
    data: { ...(id ? { id } : {}), slug, ownerId: userId, name },
  });

  return NextResponse.json({ project }, { status: 201 });
}
