"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { useUpdateMyPresence, useOther, useEventListener } from "@liveblocks/react"
import type { CursorsCursorProps } from "@liveblocks/react-flow"
import {
  ReactFlow,
  Background,
  type Connection,
  BackgroundVariant,
  ConnectionMode,
  ReactFlowProvider,
  useReactFlow,
  useStore,
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react"
import { useAutosave } from "@/hooks/use-autosave"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"
import { Minus, Plus, Maximize2, Undo2, Redo2, Check, CloudOff, Loader2 } from "lucide-react"
import { NODE_COLORS, type CanvasNode, type CanvasEdge, type ShapeDragPayload } from "@/types/canvas"
import { AiStatusFeedPayloadSchema } from "@/types/tasks"
import { CanvasNodeRenderer } from "./canvas-node"
import { CanvasEdgeRenderer } from "./canvas-edge"
import { ShapePanel } from "./shape-panel"
import { StarterTemplatesModal } from "./starter-templates-modal"
import { PresenceAvatars } from "./presence-avatars"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useWorkspace } from "./workspace-context"
import type { CanvasTemplate } from "./starter-templates"

function LiveCursor({ connectionId }: CursorsCursorProps) {
  const info = useOther(connectionId, (other) => other.info)
  const thinking = useOther(connectionId, (other) => other.presence.thinking)
  if (!info) return null

  const color = info.color ?? "#6b7280"
  const name = info.name ?? "Unknown"

  return (
    <div style={{ pointerEvents: "none", userSelect: "none" }}>
      <svg
        width="16"
        height="18"
        viewBox="0 0 16 18"
        fill="none"
        style={{ display: "block" }}
      >
        <path
          d="M0 0 L0 14 L4 10 L6.5 16 L8.5 15 L6 9 L10.5 9 Z"
          fill={color}
          stroke="#18181c"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          marginTop: 2,
          marginLeft: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          backgroundColor: "rgba(14, 14, 16, 0.85)",
          color: color,
          border: `1px solid ${color}`,
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
          borderRadius: 6,
          padding: "3px 7px",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
      >
        {thinking && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
        {name}
      </div>
    </div>
  )
}

// Subscribes to ai-status broadcasts inside the RoomProvider tree and pushes
// validated messages to workspace context so AiSidebar (outside the room) can read them.
function AiStatusBridge() {
  const { setAiStatusMessage } = useWorkspace()

  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return
    const parsed = AiStatusFeedPayloadSchema.safeParse(event)
    if (!parsed.success) return
    const { status, step, text } = parsed.data
    setAiStatusMessage({ status, step, text })
  })

  return null
}

function SaveStatusIndicator({ saveStatus }: { saveStatus: import("@/hooks/use-autosave").SaveStatus }) {
  const [display, setDisplay] = useState<"saving" | "saved" | "error" | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (saveStatus === "saving") {
      // Cancel any pending hide — keep showing while in progress
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      setDisplay("saving")
    } else if (saveStatus === "saved" || saveStatus === "error") {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      setDisplay(saveStatus)
      hideTimerRef.current = setTimeout(() => setDisplay(null), 2000)
    }
    // "idle" — do nothing; the hide timer above handles the fadeout
  }, [saveStatus])

  if (!display) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[72px] z-20 flex justify-center">
      {display === "saving" && (
        <span className="flex items-center gap-2 rounded-full border border-[#2a2a30] bg-[#18181c] px-4 py-1.5 text-sm font-medium text-copy-secondary shadow-lg">
          <Loader2 size={13} className="animate-spin text-brand" />
          Saving…
        </span>
      )}
      {display === "saved" && (
        <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-1.5 text-sm font-medium text-success shadow-lg">
          <Check size={13} />
          Saved
        </span>
      )}
      {display === "error" && (
        <span className="flex items-center gap-2 rounded-full border border-error/30 bg-error/10 px-4 py-1.5 text-sm font-medium text-error shadow-lg">
          <CloudOff size={13} />
          Save failed
        </span>
      )}
    </div>
  )
}

const nodeTypes = {
  canvasNode: CanvasNodeRenderer,
}

const edgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
}

const DEFAULT_COLOR = NODE_COLORS[0]


let nodeIdCounter = 0
let edgeIdCounter = 0

function generateNodeId(shape: string): string {
  return `${shape}-${Date.now()}-${++nodeIdCounter}`
}

interface CanvasInnerProps {
  projectId: string
}

function CanvasInner({ projectId }: CanvasInnerProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const flowInstance = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = flowInstance
  const domNode = useStore((s) => s.domNode)

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts({ flowInstance, undo, redo })

  // saveStatus lives here so both the canvas indicator and navbar context
  // see the same value in the same render — no async one-cycle lag.
  const [saveStatus, setSaveStatus] = useState<import("@/hooks/use-autosave").SaveStatus>("idle")
  const { setSaveStatus: setContextSaveStatus, manualSaveRef, canvasSnapshotRef } = useWorkspace()

  // Keep context in sync synchronously via layout effect (before paint)
  useEffect(() => {
    setContextSaveStatus(saveStatus)
  }, [saveStatus, setContextSaveStatus])

  // Load saved canvas when room starts empty
  const [loadAttempted, setLoadAttempted] = useState(false)
  const isDroppingRef = useRef(false)
  useEffect(() => {
    if (loadAttempted) return
    if (nodes.length > 0 || edges.length > 0) {
      setLoadAttempted(true)
      return
    }
    setLoadAttempted(true)
    fetch(`/api/projects/${projectId}/canvas`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null } | null) => {
        if (!data?.canvas) return
        const { nodes: savedNodes, edges: savedEdges } = data.canvas
        if (!savedNodes?.length && !savedEdges?.length) return
        onNodesChange(savedNodes.map((n) => ({ type: "add" as const, item: n })))
        onEdgesChange(savedEdges.map((e) => ({ type: "add" as const, item: e })))
        setTimeout(() => fitView({ duration: 400, padding: 0.12 }), 150)
      })
      .catch(() => {})
  // run once after Liveblocks hydrates (nodes/edges lengths are stable on first render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempted])

  const { manualSave } = useAutosave({ projectId, nodes, edges, onStatusChange: setSaveStatus })
  useEffect(() => {
    manualSaveRef.current = manualSave
  })

  // Keep canvas snapshot current so AiSidebar can read it for spec generation
  useEffect(() => {
    canvasSnapshotRef.current = { nodes: nodes as CanvasNode[], edges: edges as CanvasEdge[] }
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return

      const selectedNodes = nodes.filter((n: CanvasNode) => n.selected)
      const selectedEdges = edges.filter((ed: CanvasEdge) => ed.selected)
      if (!selectedNodes.length && !selectedEdges.length) return

      e.preventDefault()
      onDelete({ nodes: selectedNodes, edges: selectedEdges })
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [nodes, edges, onDelete])

  const updateMyPresence = useUpdateMyPresence()

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      updateMyPresence({ cursor: pos })
    },
    [screenToFlowPosition, updateMyPresence],
  )

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const { templatesOpen, setTemplatesOpen } = useWorkspace()

  const importTemplate = useCallback(
    (template: CanvasTemplate) => {
      onNodesChange([
        ...nodes.map((nd) => ({ type: "remove" as const, id: nd.id })),
        ...template.nodes.map((nd) => ({ type: "add" as const, item: nd })),
      ])
      onEdgesChange([
        ...edges.map((ed) => ({ type: "remove" as const, id: ed.id })),
        ...template.edges.map((ed) => ({ type: "add" as const, item: ed })),
      ])
      setTimeout(() => fitView({ duration: 400, padding: 0.12 }), 150)
    },
    [nodes, edges, onNodesChange, onEdgesChange, fitView],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const newEdge: CanvasEdge = {
        id: `edge-${Date.now()}-${++edgeIdCounter}`,
        type: "canvasEdge",
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
        data: {},
      }
      onEdgesChange([{ type: "add", item: newEdge }])
    },
    [onEdgesChange],
  )

  // Stable refs so the native event listeners always call the latest values
  // without needing to be re-attached on every render.
  const screenToFlowPositionRef = useRef(screenToFlowPosition)
  const onNodesChangeRef = useRef(onNodesChange)
  screenToFlowPositionRef.current = screenToFlowPosition
  onNodesChangeRef.current = onNodesChange

  useEffect(() => {
    if (!domNode) return

    const pane = domNode.querySelector<HTMLElement>(".react-flow__pane")
    if (!pane) return

    function handleDragOver(e: DragEvent) {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
    }

    function handleDrop(e: DragEvent) {
      e.preventDefault()
      isDroppingRef.current = true
      setTimeout(() => { isDroppingRef.current = false }, 0)

      const raw = e.dataTransfer?.getData("application/json")
      if (!raw) return

      let payload: ShapeDragPayload
      try {
        payload = JSON.parse(raw) as ShapeDragPayload
      } catch {
        return
      }

      const position = screenToFlowPositionRef.current({ x: e.clientX, y: e.clientY })

      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: "canvasNode",
        position: {
          x: position.x - payload.width / 2,
          y: position.y - payload.height / 2,
        },
        data: {
          label: "",
          shape: payload.shape,
          color: DEFAULT_COLOR.fill,
        },
        width: payload.width,
        height: payload.height,
      }

      onNodesChangeRef.current([{ type: "add", item: newNode }])
    }

    pane.addEventListener("dragover", handleDragOver)
    pane.addEventListener("drop", handleDrop)

    return () => {
      pane.removeEventListener("dragover", handleDragOver)
      pane.removeEventListener("drop", handleDrop)
    }
  }, [domNode])

  return (
    <div className="relative h-full w-full">
      <AiStatusBridge />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#2a2a30"
          gap={20}
          size={1.5}
        />
        <Cursors components={{ Cursor: LiveCursor }} />
      </ReactFlow>
      <div className="pointer-events-none absolute right-4 top-4 z-10">
        <div className="pointer-events-auto">
          <PresenceAvatars />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div className="pointer-events-auto">
          <ShapePanel />
        </div>
      </div>
      <StarterTemplatesModal
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onImport={importTemplate}
      />
      <SaveStatusIndicator saveStatus={saveStatus} />
      <div className="pointer-events-none absolute bottom-4 left-4">
        <div className="pointer-events-auto flex items-center rounded-xl border border-[#2a2a30] bg-[#18181c] px-1 py-1">
          <button
            onClick={() => zoomOut({ duration: 200 })}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => fitView({ duration: 300 })}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary"
            title="Fit view"
            aria-label="Fit view"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={() => zoomIn({ duration: 200 })}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus size={14} />
          </button>
          <div className="mx-1 h-4 w-px bg-[#2a2a30]" />
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

interface CanvasProps {
  projectId: string
}

export function Canvas({ projectId }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner projectId={projectId} />
    </ReactFlowProvider>
  )
}
