"use client"

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useEventListener,
} from "@liveblocks/react"
import { ErrorBoundary } from "react-error-boundary"
import { useRouter } from "next/navigation"
import { Canvas } from "./canvas"
import { AiSidebar } from "./ai-sidebar"
import { useWorkspace } from "./workspace-context"

interface CanvasRoomProps {
  roomId: string
  projectId: string
}

function ProjectDeletedListener() {
  const router = useRouter()
  useEventListener(({ event }) => {
    if (event.type === "project-deleted") {
      router.push("/editor")
      router.refresh()
    }
  })
  return null
}

function RoomContents({ projectId }: { projectId: string }) {
  const { aiSidebarOpen, setAiSidebarOpen } = useWorkspace()
  return (
    <>
      <ProjectDeletedListener />
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
      <AiSidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />
    </>
  )
}

export function CanvasRoom({ roomId, projectId }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <RoomContents projectId={projectId} />
      </RoomProvider>
    </LiveblocksProvider>
  )
}
