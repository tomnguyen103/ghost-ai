"use client"

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

export function ShapePanel() {
  function handleDragStart(e: React.DragEvent, config: ShapeConfig) {
    const payload: ShapeDragPayload = {
      shape: config.shape,
      width: config.width,
      height: config.height,
    }
    e.dataTransfer.setData("application/json", JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
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
  )
}
