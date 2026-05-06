"use client"

import type { CSSProperties } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NODE_COLORS, type CanvasNode, type NodeShape } from "@/types/canvas"

const DEFAULT_COLOR = NODE_COLORS[0]

function shapeStyle(shape: NodeShape, borderColor: string, borderWidth: number): CSSProperties {
  switch (shape) {
    case "diamond":
      return {
        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        // drop-shadow applies after clip-path, so it outlines the clipped shape
        filter: `drop-shadow(0 0 ${borderWidth}px ${borderColor})`,
      }
    case "hexagon":
      return {
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        filter: `drop-shadow(0 0 ${borderWidth}px ${borderColor})`,
      }
    case "circle":
      return { borderRadius: "50%", border: `${borderWidth}px solid ${borderColor}` }
    case "pill":
      return { borderRadius: "9999px", border: `${borderWidth}px solid ${borderColor}` }
    case "cylinder":
      // Arched top and bottom with straight sides — database/drum silhouette
      return {
        borderRadius: "50% 50% 50% 50% / 20% 20% 20% 20%",
        border: `${borderWidth}px solid ${borderColor}`,
      }
    case "rectangle":
    default:
      return { borderRadius: "10px", border: `${borderWidth}px solid ${borderColor}` }
  }
}

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const shape = data.shape ?? "rectangle"
  const fill = data.color ?? DEFAULT_COLOR.fill
  const colorEntry = NODE_COLORS.find((c) => c.fill === fill) ?? DEFAULT_COLOR

  const borderColor = selected ? "#00c8d4" : "#2a2a30"
  const borderWidth = selected ? 2 : 1

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <div
        className="flex h-full w-full items-center justify-center px-3 py-2 text-sm font-medium"
        style={{
          backgroundColor: fill,
          color: colorEntry.text,
          ...shapeStyle(shape, borderColor, borderWidth),
        }}
      >
        <span className="max-w-48 truncate">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
    </>
  )
}
