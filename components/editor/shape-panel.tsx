"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Square, Diamond, Circle, Pill, Cylinder, Hexagon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NodeShape, ShapeDragPayload } from "@/types/canvas"

interface ShapeConfig {
  shape: NodeShape
  icon: LucideIcon
  label: string
  width: number
  height: number
}

const SHAPE_CONFIGS: ShapeConfig[] = [
  { shape: "rectangle", icon: Square, label: "Rectangle", width: 160, height: 80 },
  { shape: "diamond", icon: Diamond, label: "Diamond", width: 140, height: 140 },
  { shape: "circle", icon: Circle, label: "Circle", width: 80, height: 80 },
  { shape: "pill", icon: Pill, label: "Pill", width: 160, height: 60 },
  { shape: "cylinder", icon: Cylinder, label: "Cylinder", width: 100, height: 100 },
  { shape: "hexagon", icon: Hexagon, label: "Hexagon", width: 120, height: 120 },
]

const GHOST_FILL = "rgba(0, 200, 212, 0.1)"
const GHOST_STROKE = "#00c8d4"
const GHOST_SW = 1.5

function ShapeGhost({ shape }: { shape: NodeShape }) {
  if (shape === "diamond") {
    return (
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points="50,0 100,50 50,100 0,50"
          fill={GHOST_FILL}
          stroke={GHOST_STROKE}
          strokeWidth={GHOST_SW}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }
  if (shape === "hexagon") {
    return (
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points="25,0 75,0 100,50 75,100 25,100 0,50"
          fill={GHOST_FILL}
          stroke={GHOST_STROKE}
          strokeWidth={GHOST_SW}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }
  if (shape === "cylinder") {
    return (
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Body fill */}
        <rect x="0" y="12" width="100" height="76" fill={GHOST_FILL} stroke="none" />
        {/* Top cap fill */}
        <ellipse cx="50" cy="12" rx="50" ry="10" fill={GHOST_FILL} stroke="none" />
        {/* Bottom cap fill */}
        <ellipse cx="50" cy="88" rx="50" ry="10" fill={GHOST_FILL} stroke="none" />
        {/* Side outlines */}
        <path
          d="M 1,12 L 1,88 M 99,12 L 99,88"
          fill="none"
          stroke={GHOST_STROKE}
          strokeWidth={GHOST_SW}
          vectorEffect="non-scaling-stroke"
        />
        {/* Top ellipse outline */}
        <ellipse
          cx="50"
          cy="12"
          rx="49"
          ry="10"
          fill="none"
          stroke={GHOST_STROKE}
          strokeWidth={GHOST_SW}
          vectorEffect="non-scaling-stroke"
        />
        {/* Bottom ellipse outline */}
        <ellipse
          cx="50"
          cy="88"
          rx="49"
          ry="10"
          fill="none"
          stroke={GHOST_STROKE}
          strokeWidth={GHOST_SW}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }
  if (shape === "circle") {
    return (
      <div
        className="h-full w-full rounded-full"
        style={{ backgroundColor: GHOST_FILL, border: `${GHOST_SW}px solid ${GHOST_STROKE}` }}
      />
    )
  }
  if (shape === "pill") {
    return (
      <div
        className="h-full w-full"
        style={{
          backgroundColor: GHOST_FILL,
          border: `${GHOST_SW}px solid ${GHOST_STROKE}`,
          borderRadius: "9999px",
        }}
      />
    )
  }
  return (
    <div
      className="h-full w-full"
      style={{
        backgroundColor: GHOST_FILL,
        border: `${GHOST_SW}px solid ${GHOST_STROKE}`,
        borderRadius: "10px",
      }}
    />
  )
}

interface DragState {
  shape: NodeShape
  width: number
  height: number
  x: number
  y: number
}

export function ShapePanel() {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    function handleDragOver(e: DragEvent) {
      if (!isDraggingRef.current) return
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
    }

    function handleDragEnd() {
      isDraggingRef.current = false
      setDragState(null)
    }

    document.addEventListener("dragover", handleDragOver)
    document.addEventListener("dragend", handleDragEnd)

    return () => {
      document.removeEventListener("dragover", handleDragOver)
      document.removeEventListener("dragend", handleDragEnd)
    }
  }, [])

  function handleDragStart(e: React.DragEvent, config: ShapeConfig) {
    const payload: ShapeDragPayload = {
      shape: config.shape,
      width: config.width,
      height: config.height,
    }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"

    // Replace the native browser ghost with an invisible element so only
    // our custom preview is visible during the drag.
    const ghost = document.createElement("div")
    ghost.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;"
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => ghost.remove(), 0)

    isDraggingRef.current = true
    setDragState({
      shape: config.shape,
      width: config.width,
      height: config.height,
      x: e.clientX,
      y: e.clientY,
    })
  }

  return (
    <>
      <div className="flex items-center gap-1 rounded-full border border-border-default bg-elevated px-3 py-2 shadow-lg">
        {SHAPE_CONFIGS.map((config) => {
          const Icon = config.icon
          return (
            <button
              key={config.shape}
              draggable
              onDragStart={(e) => handleDragStart(e, config)}
              className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
              title={config.label}
              aria-label={config.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>
      {dragState &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50"
            style={{
              left: dragState.x - dragState.width / 2,
              top: dragState.y - dragState.height / 2,
              width: dragState.width,
              height: dragState.height,
              opacity: 0.8,
            }}
          >
            <ShapeGhost shape={dragState.shape} />
          </div>,
          document.body
        )}
    </>
  )
}
