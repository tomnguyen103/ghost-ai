import { auth, currentUser } from "@clerk/nextjs/server"
import { getLiveblocksClient, getCursorColor } from "@/lib/liveblocks"
import { getProjectAccess } from "@/lib/project-access"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<Response> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let room: string
    try {
      const body = await request.json()
      room = body?.room
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!room || typeof room !== "string") {
      return NextResponse.json({ error: "Missing room" }, { status: 400 })
    }

    const user = await currentUser()
    const email =
      user?.primaryEmailAddress?.emailAddress.toLowerCase() ?? null

    const project = await getProjectAccess(room, userId, email)
    if (!project) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const client = getLiveblocksClient()
    await client.getOrCreateRoom(room, { defaultAccesses: [] })
    await client.updateRoom(room, {
      usersAccesses: { [userId]: ["room:write"] },
    })

    const name =
      user?.fullName ??
      user?.firstName ??
      user?.primaryEmailAddress?.emailAddress ??
      "Unknown"
    const avatar = user?.imageUrl ?? ""
    const color = getCursorColor(userId)

    const { status, body } = await client.identifyUser(
      userId,
      { userInfo: { name, avatar, color } }
    )

    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("[liveblocks-auth] unhandled error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
