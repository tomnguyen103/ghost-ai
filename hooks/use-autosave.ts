"use client"

import { useEffect, useRef, useCallback } from "react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UseAutosaveOptions {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  onStatusChange: (status: SaveStatus) => void
  debounceMs?: number
}

export function useAutosave({
  projectId,
  nodes,
  edges,
  onStatusChange,
  debounceMs = 2000,
}: UseAutosaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  // Track serialized content so we only save when data actually changed,
  // not on every render (React Flow returns new array refs each render).
  const lastSavedRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)

  const save = useCallback(
    async (n: CanvasNode[], e: CanvasEdge[]) => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      onStatusChangeRef.current("saving")
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes: n, edges: e }),
        })
        if (!res.ok) throw new Error("Save failed")
        onStatusChangeRef.current("saved")
      } catch {
        onStatusChangeRef.current("error")
      }
      resetTimerRef.current = setTimeout(() => onStatusChangeRef.current("idle"), 2500)
    },
    [projectId]
  )

  useEffect(() => {
    const serialized = JSON.stringify({ nodes, edges })

    // On first run, record the initial state without saving — this is the
    // loaded/empty canvas state and doesn't need to be persisted yet.
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      lastSavedRef.current = serialized
      return
    }

    // Skip if nothing actually changed (reference churn from React Flow).
    if (serialized === lastSavedRef.current) return

    lastSavedRef.current = serialized

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      save(nodes, edges)
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // nodes/edges references change every render — we rely on the serialized
  // comparison above to gate actual saves, so we intentionally omit them
  // from the dep array and use a no-dep effect that runs after every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, save, debounceMs])

  const manualSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    save(nodes, edges)
  }, [save, nodes, edges])

  return { manualSave }
}
