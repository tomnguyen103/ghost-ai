"use client"

import { useOthers } from "@liveblocks/react"
import { useUser } from "@clerk/nextjs"

interface CollaboratorAvatarProps {
  name: string
  avatar: string
  color: string
  offset: number
  zIndex: number
}

function CollaboratorAvatar({ name, avatar, color, offset, zIndex }: CollaboratorAvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()

  return (
    <div
      title={name}
      className="h-8 w-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold select-none"
      style={{
        backgroundColor: avatar ? undefined : color,
        marginLeft: offset,
        position: "relative",
        zIndex,
        boxShadow: "0 0 0 2px #18181c",
      }}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span className="text-white">{initials || "?"}</span>
      )}
    </div>
  )
}

export function PresenceAvatars() {
  const { user } = useUser()
  const others = useOthers()

  const collaborators = others.filter((o) => o.id !== user?.id)
  const visible = collaborators.slice(0, 5)
  const overflow = collaborators.length - 5

  return (
    <div className="flex items-center gap-2">
      {visible.length > 0 && (
        <>
          <div className="flex items-center">
            {visible.map((other, i) => (
              <CollaboratorAvatar
                key={other.connectionId}
                name={other.info?.name ?? "Unknown"}
                avatar={other.info?.avatar ?? ""}
                color={other.info?.color ?? "#6b7280"}
                offset={i === 0 ? 0 : -8}
                zIndex={i}
              />
            ))}
            {overflow > 0 && (
              <div
                className="h-8 w-8 shrink-0 rounded-full bg-[#2a2a30] flex items-center justify-center text-xs font-medium text-copy-secondary select-none"
                style={{
                  marginLeft: -8,
                  position: "relative",
                  zIndex: visible.length,
                  boxShadow: "0 0 0 2px #18181c",
                }}
              >
                +{overflow}
              </div>
            )}
          </div>
          <div className="h-5 w-px bg-[#2a2a30]" />
        </>
      )}
    </div>
  )
}
