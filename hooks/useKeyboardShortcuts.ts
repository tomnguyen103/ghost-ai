"use client"

import { useEffect, useRef } from "react"
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
  const handlers = useRef({ flowInstance, undo, redo })
  handlers.current = { flowInstance, undo, redo }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return

      const ctrl = e.ctrlKey || e.metaKey
      const { flowInstance: fi, undo: u, redo: r } = handlers.current

      if (ctrl && e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault()
        r()
        return
      }
      if (ctrl && (e.key === "y" || e.key === "Y")) {
        e.preventDefault()
        r()
        return
      }
      if (ctrl && (e.key === "z" || e.key === "Z")) {
        e.preventDefault()
        u()
        return
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault()
        fi.zoomIn({ duration: 200 })
        return
      }
      if (e.key === "-") {
        e.preventDefault()
        fi.zoomOut({ duration: 200 })
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
