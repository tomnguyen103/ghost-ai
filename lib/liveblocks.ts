import { Liveblocks } from "@liveblocks/node"

const CURSOR_COLORS = [
  "#E57373", // red
  "#F06292", // pink
  "#BA68C8", // purple
  "#64B5F6", // blue
  "#4DB6AC", // teal
  "#81C784", // green
  "#FFD54F", // amber
  "#FF8A65", // orange
]

export function getCursorColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length]
}

declare global {
  // eslint-disable-next-line no-var
  var _liveblocks: Liveblocks | undefined
}

export function getLiveblocksClient(): Liveblocks {
  if (process.env.NODE_ENV === "production") {
    return new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY! })
  }
  return (globalThis._liveblocks ??= new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
  }))
}
