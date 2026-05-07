"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react"
import type { CanvasEdge } from "@/types/canvas"

export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { updateEdgeData } = useReactFlow()

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const label = data?.label ?? ""
  const isActive = selected || isHovered
  const strokeColor = isActive ? "#c0c0cc" : "#505060"
  const markerId = `ghost-arrow-${id}`

  const startEditing = useCallback(() => {
    setEditValue(label)
    setIsEditing(true)
  }, [label])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setEditValue(val)
      updateEdgeData(id, { label: val })
    },
    [id, updateEdgeData],
  )

  const stopEditing = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault()
      setIsEditing(false)
    }
  }, [])

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={strokeColor} />
        </marker>
      </defs>

      {/*
        Wide invisible hit area. SVG pointer-events only fire on "visible" strokes
        (visiblePainted default), so strokeOpacity={0} keeps it invisible while
        remaining a valid event target. pointerEvents="all" ensures events fire
        regardless of opacity.
      */}
      <path
        d={edgePath}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0}
        strokeWidth={20}
        style={{ cursor: "pointer", pointerEvents: "all" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      />

      {/* Visible edge — pointer-events off so only the hit area handles interaction */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
        style={{ pointerEvents: "none", transition: "stroke 0.15s ease" }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation()
            startEditing()
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={handleChange}
              onBlur={stopEditing}
              onKeyDown={handleKeyDown}
              placeholder="Label"
              className="nodrag nopan rounded border border-[#2a2a30] bg-[#18181c] px-2 py-0.5 text-center text-xs text-[#c0c0cc] outline-none"
              style={{ width: `${Math.max((editValue.length || 4) * 8 + 16, 64)}px` }}
            />
          ) : label ? (
            <span className="rounded-full border border-[#2a2a30] bg-[#18181c] px-2 py-0.5 text-xs text-[#808090]">
              {label}
            </span>
          ) : isActive ? (
            <span className="rounded-full border border-[#2a2a30] bg-[#18181c] px-2 py-0.5 text-xs text-[#505060] opacity-60">
              double-click to label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
