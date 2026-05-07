"use client"

import { useEffect, useEffectEvent } from "react"
import type { ReactFlowInstance } from "@xyflow/react"

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable
}

export function useKeyboardShortcuts({
  flowInstance,
  undo,
  redo,
}: {
  flowInstance: Pick<ReactFlowInstance, "zoomIn" | "zoomOut">
  undo: () => void
  redo: () => void
}) {
  const onUndo = useEffectEvent(undo)
  const onRedo = useEffectEvent(redo)
  const onZoomIn = useEffectEvent(() => flowInstance.zoomIn({ duration: 200 }))
  const onZoomOut = useEffectEvent(() => flowInstance.zoomOut({ duration: 200 }))

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault()
        onRedo()
        return
      }
      if (ctrl && (e.key === "y" || e.key === "Y")) {
        e.preventDefault()
        onRedo()
        return
      }
      if (ctrl && (e.key === "z" || e.key === "Z")) {
        e.preventDefault()
        onUndo()
        return
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault()
        onZoomIn()
        return
      }
      if (e.key === "-") {
        e.preventDefault()
        onZoomOut()
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
