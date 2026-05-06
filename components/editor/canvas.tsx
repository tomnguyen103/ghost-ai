"use client"

import { useRef, useEffect } from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  type MiniMapNodeProps,
  BackgroundVariant,
  ConnectionMode,
  ReactFlowProvider,
  useReactFlow,
  useStore,
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"
import { NODE_COLORS, type CanvasNode, type CanvasEdge, type CanvasNodeData, type ShapeDragPayload } from "@/types/canvas"
import { CanvasNodeRenderer } from "./canvas-node"
import { ShapePanel } from "./shape-panel"

const nodeTypes = {
  canvasNode: CanvasNodeRenderer,
}

const DEFAULT_COLOR = NODE_COLORS[0]

function MiniMapShapeNode({ id, x, y, width, height, color, strokeColor, strokeWidth }: MiniMapNodeProps) {
  const shape = useStore((s) => (s.nodeLookup.get(id)?.data as CanvasNodeData | undefined)?.shape ?? "rectangle")

  const cx = x + width / 2
  const cy = y + height / 2
  const shared = { fill: color, stroke: strokeColor, strokeWidth }

  switch (shape) {
    case "diamond":
      return <polygon points={`${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`} {...shared} />
    case "hexagon":
      return (
        <polygon
          points={[
            `${x + width * 0.25},${y}`,
            `${x + width * 0.75},${y}`,
            `${x + width},${cy}`,
            `${x + width * 0.75},${y + height}`,
            `${x + width * 0.25},${y + height}`,
            `${x},${cy}`,
          ].join(" ")}
          {...shared}
        />
      )
    case "circle":
      return <ellipse cx={cx} cy={cy} rx={width / 2} ry={height / 2} {...shared} />
    case "pill":
      return <rect x={x} y={y} width={width} height={height} rx={Math.min(width, height) / 2} {...shared} />
    case "cylinder":
      return <rect x={x} y={y} width={width} height={height} rx={width * 0.15} {...shared} />
    case "rectangle":
    default:
      return <rect x={x} y={y} width={width} height={height} rx={4} {...shared} />
  }
}

let nodeIdCounter = 0

function generateNodeId(shape: string): string {
  return `${shape}-${Date.now()}-${++nodeIdCounter}`
}

function CanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const { screenToFlowPosition } = useReactFlow()
  const domNode = useStore((s) => s.domNode)

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
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#2a2a30"
          gap={20}
          size={1.5}
        />
        <MiniMap
          style={{
            backgroundColor: "#18181c",
            border: "1px solid #2a2a30",
            borderRadius: "8px",
          }}
          nodeColor={(node: CanvasNode) => node.data.color ?? "#505060"}
          nodeStrokeColor="#2a2a30"
          maskColor="rgba(8, 8, 9, 0.65)"
          nodeComponent={MiniMapShapeNode}
        />
        <Cursors />
      </ReactFlow>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div className="pointer-events-auto">
          <ShapePanel />
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
