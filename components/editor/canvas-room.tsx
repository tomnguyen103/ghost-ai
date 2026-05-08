"use client"

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react"
import { ErrorBoundary } from "react-error-boundary"
import { Canvas } from "./canvas"

interface CanvasRoomProps {
  roomId: string
  projectId: string
}

export function CanvasRoom({ roomId, projectId }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <ErrorBoundary
          fallback={
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-copy-muted">Canvas connection error</p>
            </div>
          }
        >
          <ClientSideSuspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-copy-faint">Connecting…</p>
              </div>
            }
          >
            <Canvas projectId={projectId} />
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
