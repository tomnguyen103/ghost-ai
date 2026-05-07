"use client"

import { useRef, useEffect, useCallback } from "react"
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
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"
import { Minus, Plus, Maximize2, Undo2, Redo2 } from "lucide-react"
import { NODE_COLORS, type CanvasNode, type CanvasEdge, type ShapeDragPayload } from "@/types/canvas"
import { CanvasNodeRenderer } from "./canvas-node"
import { CanvasEdgeRenderer } from "./canvas-edge"
import { ShapePanel } from "./shape-panel"
import { StarterTemplatesModal } from "./starter-templates-modal"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useWorkspace } from "./workspace-context"
import type { CanvasTemplate } from "./starter-templates"

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

function CanvasInner() {
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
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#2a2a30"
          gap={20}
          size={1.5}
        />
        <Cursors />
      </ReactFlow>
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
      <div className="pointer-events-none absolute bottom-4 left-4">
        <div className="pointer-events-auto flex items-center rounded-xl border border-[#2a2a30] bg-[#18181c] px-1 py-1">
          <button
            onClick={() => zoomOut({ duration: 200 })}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary"
            title="Zoom out"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => fitView({ duration: 300 })}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary"
            title="Fit view"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={() => zoomIn({ duration: 200 })}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary"
            title="Zoom in"
          >
            <Plus size={14} />
          </button>
          <div className="mx-1 h-4 w-px bg-[#2a2a30]" />
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-[#2a2a30] hover:text-copy-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
