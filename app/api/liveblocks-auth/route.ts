import { auth, currentUser } from "@clerk/nextjs/server"
import { getLiveblocksClient, getCursorColor } from "@/lib/liveblocks"
import { getProjectAccess } from "@/lib/project-access"

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { room } = await request.json()
  if (!room || typeof room !== "string") {
    return new Response("Missing room", { status: 400 })
  }

  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress.toLowerCase() ?? null

  const project = await getProjectAccess(room, userId, email)
  if (!project) {
    return new Response("Forbidden", { status: 403 })
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

  return new Response(body, { status })
}
