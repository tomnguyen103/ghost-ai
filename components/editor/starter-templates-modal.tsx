"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NODE_COLORS, type NodeShape } from "@/types/canvas"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates"

const PREVIEW_W = 300
const PREVIEW_H = 160
const PREVIEW_PAD = 12

function PreviewNode({
  x, y, w, h, fill, shape,
}: {
  x: number; y: number; w: number; h: number; fill: string; shape: NodeShape
}) {
  const stroke = "#505060"
  const sw = 0.5
  const cx = x + w / 2
  const cy = y + h / 2

  switch (shape) {
    case "circle":
      return <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />
    case "pill":
      return <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) / 2} fill={fill} stroke={stroke} strokeWidth={sw} />
    case "diamond":
      return (
        <polygon
          points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      )
    case "hexagon":
      return (
        <polygon
          points={`${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${cy} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${cy}`}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      )
    case "cylinder": {
      const ry = h * 0.15
      return (
        <g>
          <rect x={x} y={y + ry} width={w} height={h - ry * 2} fill={fill} stroke="none" />
          <ellipse cx={cx} cy={y + ry} rx={w / 2} ry={ry} fill={fill} stroke={stroke} strokeWidth={sw} />
          <ellipse cx={cx} cy={y + h - ry} rx={w / 2} ry={ry} fill={fill} stroke={stroke} strokeWidth={sw} />
          <line x1={x} y1={y + ry} x2={x} y2={y + h - ry} stroke={stroke} strokeWidth={sw} />
          <line x1={x + w} y1={y + ry} x2={x + w} y2={y + h - ry} stroke={stroke} strokeWidth={sw} />
        </g>
      )
    }
    default:
      return <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} stroke={stroke} strokeWidth={sw} />
  }
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges } = template
  if (nodes.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    const w = node.width ?? 120
    const h = node.height ?? 60
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + w)
    maxY = Math.max(maxY, node.position.y + h)
  }

  const boundsW = maxX - minX || 1
  const boundsH = maxY - minY || 1
  const drawW = PREVIEW_W - PREVIEW_PAD * 2
  const drawH = PREVIEW_H - PREVIEW_PAD * 2
  const scale = Math.min(drawW / boundsW, drawH / boundsH)
  const scaledW = boundsW * scale
  const scaledH = boundsH * scale
  const ox = PREVIEW_PAD + (drawW - scaledW) / 2
  const oy = PREVIEW_PAD + (drawH - scaledH) / 2

  function sv(nx: number, ny: number) {
    return { x: ox + (nx - minX) * scale, y: oy + (ny - minY) * scale }
  }

  const nodeMap = new Map(nodes.map((nd) => [nd.id, nd]))

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      style={{ background: "#0d0d0f", display: "block", aspectRatio: `${PREVIEW_W}/${PREVIEW_H}` }}
    >
      {edges.map((edge) => {
        const src = nodeMap.get(edge.source)
        const tgt = nodeMap.get(edge.target)
        if (!src || !tgt) return null
        const sw2 = src.width ?? 120, sh2 = src.height ?? 60
        const tw = tgt.width ?? 120, th = tgt.height ?? 60
        const sp = sv(src.position.x + sw2 / 2, src.position.y + sh2 / 2)
        const tp = sv(tgt.position.x + tw / 2, tgt.position.y + th / 2)
        return (
          <line key={edge.id} x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y} stroke="#404050" strokeWidth={0.8} />
        )
      })}
      {nodes.map((node) => {
        const nw = (node.width ?? 120) * scale
        const nh = (node.height ?? 60) * scale
        const { x, y } = sv(node.position.x, node.position.y)
        const fill = node.data.color ?? NODE_COLORS[0].fill
        const shape = node.data.shape ?? "rectangle"
        return (
          <PreviewNode key={node.id} x={x} y={y} w={nw} h={nh} fill={fill} shape={shape} />
        )
      })}
    </svg>
  )
}

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({ open, onOpenChange, onImport }: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-0 p-0 border-border-default">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Starter Templates</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="grid grid-cols-1 gap-4 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col overflow-hidden rounded-lg border border-border-default bg-surface"
              >
                <div className="shrink-0 overflow-hidden">
                  <TemplatePreview template={template} />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  <div>
                    <p className="text-sm font-medium text-copy-primary">{template.name}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-copy-muted">{template.description}</p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-auto w-full"
                    onClick={() => {
                      onImport(template)
                      onOpenChange(false)
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
