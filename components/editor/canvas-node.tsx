"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Handle, NodeResizer, NodeToolbar, Position, type NodeProps, useReactFlow } from "@xyflow/react"
import { NODE_COLORS, type CanvasNode, type NodeShape } from "@/types/canvas"

const DEFAULT_COLOR = NODE_COLORS[0]
const MIN_WIDTH = 60
const MIN_HEIGHT = 40

const CONNECTION_HANDLE_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: "#ffffff",
  border: "2px solid #1a1a20",
}

const RESIZER_HANDLE_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  backgroundColor: "#1a1a20",
  borderColor: "#505060",
  borderRadius: 2,
}

const RESIZER_LINE_STYLE: React.CSSProperties = {
  borderColor: "#505060",
  borderStyle: "dashed",
  borderWidth: 1,
}

interface ShapeRenderProps {
  fill: string
  textColor: string
  borderColor: string
  strokeWidth: number
  label: string
  hideLabel: boolean
}

function CenteredLabel({
  label,
  textColor,
  hideLabel,
  className = "max-w-48 truncate text-sm font-medium",
}: {
  label: string
  textColor: string
  hideLabel: boolean
  className?: string
}) {
  return (
    <span
      className={className}
      style={{
        color: textColor,
        opacity: hideLabel ? 0 : label ? 1 : 0.4,
      }}
    >
      {label || "Label"}
    </span>
  )
}

function RectShape({ fill, textColor, borderColor, strokeWidth, label, hideLabel }: ShapeRenderProps) {
  return (
    <div
      className="flex h-full w-full items-center justify-center px-3 py-2"
      style={{
        backgroundColor: fill,
        color: textColor,
        borderRadius: "10px",
        border: `${strokeWidth}px solid ${borderColor}`,
      }}
    >
      <CenteredLabel label={label} textColor={textColor} hideLabel={hideLabel} />
    </div>
  )
}

function PillShape({ fill, textColor, borderColor, strokeWidth, label, hideLabel }: ShapeRenderProps) {
  return (
    <div
      className="flex h-full w-full items-center justify-center px-3 py-2"
      style={{
        backgroundColor: fill,
        color: textColor,
        borderRadius: "9999px",
        border: `${strokeWidth}px solid ${borderColor}`,
      }}
    >
      <CenteredLabel label={label} textColor={textColor} hideLabel={hideLabel} />
    </div>
  )
}

function CircleShape({ fill, textColor, borderColor, strokeWidth, label, hideLabel }: ShapeRenderProps) {
  return (
    <div
      className="flex h-full w-full items-center justify-center px-3 py-2"
      style={{
        backgroundColor: fill,
        color: textColor,
        borderRadius: "50%",
        border: `${strokeWidth}px solid ${borderColor}`,
      }}
    >
      <CenteredLabel label={label} textColor={textColor} hideLabel={hideLabel} />
    </div>
  )
}

function DiamondShape({ fill, textColor, borderColor, strokeWidth, label, hideLabel }: ShapeRenderProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,0 100,50 50,100 0,50"
          fill={fill}
          stroke={borderColor}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <CenteredLabel
        label={label}
        textColor={textColor}
        hideLabel={hideLabel}
        className="relative z-10 max-w-[55%] truncate text-center text-sm font-medium"
      />
    </div>
  )
}

function HexagonShape({ fill, textColor, borderColor, strokeWidth, label, hideLabel }: ShapeRenderProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="25,0 75,0 100,50 75,100 25,100 0,50"
          fill={fill}
          stroke={borderColor}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <CenteredLabel
        label={label}
        textColor={textColor}
        hideLabel={hideLabel}
        className="relative z-10 max-w-[55%] truncate text-center text-sm font-medium"
      />
    </div>
  )
}

function CylinderShape({ fill, textColor, borderColor, strokeWidth, label, hideLabel }: ShapeRenderProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Body fill */}
        <rect x="0" y="12" width="100" height="76" fill={fill} stroke="none" />
        {/* Top face fill */}
        <ellipse cx="50" cy="12" rx="50" ry="10" fill={fill} stroke="none" />
        {/* Bottom face fill */}
        <ellipse cx="50" cy="88" rx="50" ry="10" fill={fill} stroke="none" />
        {/* Body side outlines — inset 1 px to prevent stroke clipping */}
        <path
          d="M 1,12 L 1,88 M 99,12 L 99,88"
          fill="none"
          stroke={borderColor}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
        {/* Top ellipse outline */}
        <ellipse
          cx="50"
          cy="12"
          rx="49"
          ry="10"
          fill="none"
          stroke={borderColor}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
        {/* Bottom ellipse outline */}
        <ellipse
          cx="50"
          cy="88"
          rx="49"
          ry="10"
          fill="none"
          stroke={borderColor}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <CenteredLabel
        label={label}
        textColor={textColor}
        hideLabel={hideLabel}
        className="relative z-10 max-w-[55%] truncate text-center text-sm font-medium"
      />
    </div>
  )
}

export function CanvasNodeRenderer({ id, data, selected }: NodeProps<CanvasNode>) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { updateNodeData } = useReactFlow()

  const shape: NodeShape = data.shape ?? "rectangle"
  const fill = data.color ?? DEFAULT_COLOR.fill
  const colorEntry = NODE_COLORS.find((c) => c.fill === fill) ?? DEFAULT_COLOR
  const borderColor = selected ? "#00c8d4" : "#2a2a30"
  const strokeWidth = selected ? 2 : 1

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setEditValue(data.label || "")
      setIsEditing(true)
    },
    [data.label],
  )

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setEditValue(newValue)
      updateNodeData(id, { label: newValue })
    },
    [id, updateNodeData],
  )

  const stopEditing = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      setIsEditing(false)
    }
  }, [])

  const shapeProps: ShapeRenderProps = {
    fill,
    textColor: colorEntry.text,
    borderColor,
    strokeWidth,
    label: data.label || "",
    hideLabel: isEditing,
  }

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top} offset={8}>
        <div
          className="nodrag nopan flex items-center gap-1.5 rounded-xl border border-[#2a2a30] bg-[#18181c] px-2 py-1.5 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {NODE_COLORS.map((pair) => {
            const isActive = fill === pair.fill
            return (
              <button
                key={pair.fill}
                className="nodrag nopan h-5 w-5 shrink-0 cursor-pointer rounded-full transition-none"
                style={{
                  backgroundColor: pair.fill,
                  border: isActive ? `2px solid ${pair.text}` : "2px solid #3a3a42",
                  outline: isActive ? `2px solid ${pair.text}30` : "none",
                  outlineOffset: "1px",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 5px 3px ${pair.text}55`
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "none"
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  updateNodeData(id, { color: pair.fill })
                }}
              />
            )
          })}
        </div>
      </NodeToolbar>
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={RESIZER_HANDLE_STYLE}
        lineStyle={RESIZER_LINE_STYLE}
      />
      <Handle id="top" type="source" position={Position.Top} style={CONNECTION_HANDLE_STYLE} />
      <Handle id="right" type="source" position={Position.Right} style={CONNECTION_HANDLE_STYLE} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={CONNECTION_HANDLE_STYLE} />
      <Handle id="left" type="source" position={Position.Left} style={CONNECTION_HANDLE_STYLE} />
      <div className="relative h-full w-full" onDoubleClick={startEditing}>
        {shape === "rectangle" && <RectShape {...shapeProps} />}
        {shape === "pill" && <PillShape {...shapeProps} />}
        {shape === "circle" && <CircleShape {...shapeProps} />}
        {shape === "diamond" && <DiamondShape {...shapeProps} />}
        {shape === "hexagon" && <HexagonShape {...shapeProps} />}
        {shape === "cylinder" && <CylinderShape {...shapeProps} />}

        {isEditing && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={handleChange}
              onBlur={stopEditing}
              onKeyDown={handleKeyDown}
              placeholder="Label"
              className="nodrag nopan w-[80%] bg-transparent text-center text-sm font-medium outline-none"
              style={{
                color: colorEntry.text,
                caretColor: colorEntry.text,
              }}
            />
          </div>
        )}
      </div>
    </>
  )
}
