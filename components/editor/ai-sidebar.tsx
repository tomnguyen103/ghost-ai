"use client"

import { useState, useRef, useCallback, useEffect, KeyboardEvent, ChangeEvent } from "react"
import { Bot, X, FileText, Download, Send, Loader2, CheckCircle2, AlertCircle, Users, FileDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useWorkspace } from "./workspace-context"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { useBroadcastEvent, useEventListener, useSelf } from "@liveblocks/react"
import { useAuth } from "@clerk/nextjs"
import { ChatMessageSchema, type ChatMessage } from "@/types/tasks"
import ReactMarkdown from "react-markdown"

interface ProjectSpec {
  id: string
  filePath: string
  creatorId: string
  createdAt: string
}

type RunStatus = "idle" | "pending" | "running" | "completed" | "failed"

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

const AI_SENDER = "Development Plan Tools"

// Mounts useRealtimeRun and fires onStatusChange; renders nothing
function RunWatcher({
  runId,
  publicToken,
  onStatusChange,
}: {
  runId: string
  publicToken: string
  onStatusChange: (runId: string, status: RunStatus) => void
}) {
  const { run } = useRealtimeRun(runId, { accessToken: publicToken })

  useEffect(() => {
    if (!run) return
    if (run.status === "COMPLETED") {
      onStatusChange(runId, "completed")
    } else if (
      run.status === "FAILED" ||
      run.status === "CRASHED" ||
      run.status === "CANCELED" ||
      run.status === "TIMED_OUT" ||
      run.status === "SYSTEM_FAILURE"
    ) {
      onStatusChange(runId, "failed")
    } else if (run.status === "EXECUTING" || run.status === "QUEUED") {
      onStatusChange(runId, "running")
    }
  }, [run, runId, onStatusChange])

  return null
}

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

// Rendered inside RoomProvider so Liveblocks hooks have room context
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const { workspaceProject, aiStatusMessage, setAiStatusMessage } = useWorkspace()
  const self = useSelf()
  const broadcast = useBroadcastEvent()
  const { userId: currentUserId } = useAuth()

  // Refs populated by SpecsTab so we can drive it from room events
  const specsFetchRef = useRef<(() => void) | null>(null)
  const specsRemoveRef = useRef<((specId: string) => void) | null>(null)

  const isSharedGenerating =
    aiStatusMessage?.step === "start" || aiStatusMessage?.step === "processing"

  // Shared ai-chat feed — both AI Architect and Chat tabs read from this
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Architect-tab run tracking (local, not broadcast)
  const [runStatus, setRunStatus] = useState<RunStatus>("idle")
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)

  // Separate input state per tab
  const [architectInput, setArchitectInput] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [chatError, setChatError] = useState<string | null>(null)

  const architectTextareaRef = useRef<HTMLTextAreaElement>(null)
  const architectScrollRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Keep refs to mutable values so effects/callbacks always read current state
  const runStatusRef = useRef<RunStatus>("idle")
  const activeRunIdRef = useRef<string | null>(null)
  const broadcastRef = useRef(broadcast)
  useEffect(() => { broadcastRef.current = broadcast }, [broadcast])

  const isLocalGenerating = runStatus === "pending" || runStatus === "running"
  const isGenerating = isLocalGenerating || isSharedGenerating

  const selfName = self?.info?.name ?? self?.id ?? "You"

  // Add to local state immediately — broadcast only reaches other clients, not self
  const addMessage = useCallback((msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg])
    broadcastRef.current(msg)
  }, [])

  // Push the final AI result message and reset run state
  const pushCompletion = useCallback((success: boolean) => {
    if (runStatusRef.current !== "running" && runStatusRef.current !== "pending") return
    const aiMsg: ChatMessage = {
      type: "ai-chat",
      id: crypto.randomUUID(),
      sender: AI_SENDER,
      role: "assistant",
      content: success
        ? "Done! The canvas has been updated with your design."
        : "Something went wrong generating the design. Please try again.",
      timestamp: Date.now(),
    }
    addMessage(aiMsg)
    runStatusRef.current = "idle"
    setRunStatus("idle")
    activeRunIdRef.current = null
    setActiveRunId(null)
    setPublicToken(null)
  }, [addMessage])

  // Subscribe to room broadcasts from other clients (broadcast does not echo to sender)
  useEventListener(({ event }) => {
    if (event.type === "ai-chat") {
      const result = ChatMessageSchema.safeParse(event)
      if (!result.success) return
      // Skip if already added locally (self-sent messages use addMessage directly)
      setChatMessages((prev) =>
        prev.some((m) => m.id === result.data.id) ? prev : [...prev, result.data]
      )
      return
    }
    if (event.type === "spec-created") {
      specsFetchRef.current?.()
      return
    }
    if (event.type === "spec-deleted") {
      specsRemoveRef.current?.(event.specId)
    }
  })

  // Scroll both feeds to bottom on new messages
  useEffect(() => {
    if (architectScrollRef.current) {
      architectScrollRef.current.scrollTop = architectScrollRef.current.scrollHeight
    }
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // When the agent signals complete/error via ai-status broadcast:
  // - If RunWatcher isn't mounted (token-fail fallback), use this as the completion signal.
  // - Always auto-clear the status strip after 3 s.
  useEffect(() => {
    if (aiStatusMessage?.step === "complete" || aiStatusMessage?.step === "error") {
      // RunWatcher not mounted — use the broadcast event as the sole completion signal
      if (activeRunIdRef.current === null) {
        pushCompletion(aiStatusMessage.step === "complete")
      }
      const t = setTimeout(() => setAiStatusMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [aiStatusMessage, pushCompletion, setAiStatusMessage])

  // Called by RunWatcher when the Trigger.dev run reaches a terminal state
  const handleRunStatusChange = useCallback(
    (runId: string, status: RunStatus) => {
      if (status === "completed" || status === "failed") {
        // Call pushCompletion before updating the ref so its guard passes
        pushCompletion(status === "completed")
      } else {
        setRunStatus(status)
        runStatusRef.current = status
      }
    },
    [pushCompletion]
  )

  const handleArchitectSend = useCallback(async () => {
    const text = architectInput.trim()
    if (!text || isGenerating || !workspaceProject) return

    // Push user message to shared ai-chat feed immediately
    const userMsg: ChatMessage = {
      type: "ai-chat",
      id: crypto.randomUUID(),
      sender: selfName,
      role: "user",
      content: text,
      timestamp: Date.now(),
    }
    addMessage(userMsg)

    setArchitectInput("")
    if (architectTextareaRef.current) architectTextareaRef.current.style.height = "72px"
    runStatusRef.current = "pending"
    setRunStatus("pending")

    try {
      const triggerRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          roomId: workspaceProject.slug,
          projectId: workspaceProject.id,
        }),
      })

      if (!triggerRes.ok) {
        const body = await triggerRes.json().catch(() => ({})) as { error?: string }
        const detail = body?.error ?? "Unknown error"
        throw new Error(detail)
      }

      const { runId } = (await triggerRes.json()) as { runId: string }

      // Fetch a scoped public token to subscribe via useRealtimeRun
      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      })

      runStatusRef.current = "running"
      setRunStatus("running")

      if (!tokenRes.ok) {
        // Token fetch failed — the task is still running on Trigger.dev.
        // Fall back to ai-status-feed broadcasts from the agent for completion detection.
        console.warn("Token fetch failed (%d) — falling back to ai-status-feed", tokenRes.status)
        return
      }

      const { token } = (await tokenRes.json()) as { token: string }
      activeRunIdRef.current = runId
      setActiveRunId(runId)
      setPublicToken(token)
    } catch (err) {
      console.error("handleArchitectSend:", err)
      runStatusRef.current = "failed"
      setRunStatus("failed")
      const detail = err instanceof Error ? err.message : "Please try again."
      const errMsg: ChatMessage = {
        type: "ai-chat",
        id: crypto.randomUUID(),
        sender: AI_SENDER,
        role: "assistant",
        content: detail,
        timestamp: Date.now(),
      }
      addMessage(errMsg)
    }
  }, [architectInput, isGenerating, workspaceProject, selfName, addMessage])

  const handleArchitectKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleArchitectSend()
      }
    },
    [handleArchitectSend]
  )

  const handleArchitectInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setArchitectInput(e.target.value)
    const ta = e.target
    ta.style.height = "72px"
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px"
  }, [])

  const handleChip = useCallback((chip: string) => {
    setArchitectInput(chip)
    architectTextareaRef.current?.focus()
  }, [])

  const handleChatSend = useCallback(() => {
    const text = chatInput.trim()
    if (!text) return
    setChatError(null)

    const msg: ChatMessage = {
      type: "ai-chat",
      id: crypto.randomUUID(),
      sender: selfName,
      role: "user",
      content: text,
      timestamp: Date.now(),
    }

    try {
      addMessage(msg)
      setChatInput("")
    } catch {
      setChatError("Failed to send message. Please try again.")
    }
  }, [chatInput, selfName, addMessage])

  const handleChatKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleChatSend()
      }
    },
    [handleChatSend]
  )

  return (
    <aside
      className={cn(
        "absolute right-0 top-0 bottom-0 z-30 flex w-80 flex-col border-l border-border-default bg-base/95 backdrop-blur-md shadow-xl overflow-hidden transition-transform duration-200",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Subscribe to active run via Trigger.dev Realtime */}
      {activeRunId && publicToken && (runStatus === "running" || runStatus === "pending") && (
        <RunWatcher
          runId={activeRunId}
          publicToken={publicToken}
          onStatusChange={handleRunStatusChange}
        />
      )}

      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border-default px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ai/10">
          <Bot className="h-4 w-4 text-ai" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-none">
          <span className="text-sm font-semibold text-copy-primary">AI Workspace</span>
          <span className="text-[10px] text-copy-muted">Collaborate with Development Plan Tools</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-copy-muted hover:text-copy-primary"
          aria-label="Close AI sidebar"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="h-auto w-full shrink-0 rounded-none border-b border-border-default bg-transparent p-0">
          <TabsTrigger
            value="architect"
            className="flex-1 rounded-none border-b-2 border-transparent py-2.5 text-xs font-medium text-copy-muted transition-none data-[state=active]:border-brand data-[state=active]:bg-brand-dim data-[state=active]:text-brand"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex-1 rounded-none border-b-2 border-transparent py-2.5 text-xs font-medium text-copy-muted transition-none data-[state=active]:border-brand data-[state=active]:bg-brand-dim data-[state=active]:text-brand"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="flex-1 rounded-none border-b-2 border-transparent py-2.5 text-xs font-medium text-copy-muted transition-none data-[state=active]:border-brand data-[state=active]:bg-brand-dim data-[state=active]:text-brand"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="mt-0 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1" ref={architectScrollRef as never}>
            <div className="flex flex-col gap-3 p-3">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center gap-4 px-2 pb-4 pt-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/10">
                    <Bot className="h-6 w-6 text-ai" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-copy-primary">Development Plan Tools Architect</p>
                    <p className="mt-1 text-xs leading-relaxed text-copy-muted">
                      Describe your system and I&apos;ll help you design the architecture.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    {STARTER_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleChip(chip)}
                        className="rounded-full bg-subtle px-3 py-1.5 text-left text-xs text-copy-secondary transition-colors hover:bg-border-default hover:text-copy-primary"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end">
                      <div
                        className="max-w-[85%] rounded-2xl px-3 py-2 text-xs font-medium text-white"
                        style={{ backgroundColor: "#62C073" }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex justify-start gap-2">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ai/10">
                        <Bot className="h-3 w-3 text-ai" />
                      </div>
                      <div className="max-w-[85%] rounded-2xl border border-border-default bg-elevated px-3 py-2 text-xs text-copy-secondary">
                        <AssistantBubbleContent
                          content={msg.content}
                          isLastMessage={msg === chatMessages[chatMessages.length - 1]}
                          isGenerating={isGenerating}
                        />
                      </div>
                    </div>
                  )
                )
              )}

              {/* Pending indicator while run is active but no AI message yet */}
              {isLocalGenerating && !chatMessages.some((m) => m.role === "assistant") && (
                <div className="flex justify-start gap-2">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ai/10">
                    <Bot className="h-3 w-3 text-ai" />
                  </div>
                  <div className="max-w-[85%] rounded-2xl border border-border-default bg-elevated px-3 py-2 text-xs text-copy-secondary">
                    <span className="flex items-center gap-1.5 text-ai">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating your design…
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Status strip — only visible while run is active */}
          {isGenerating && (
            <div className="shrink-0 flex items-center gap-2 border-t border-border-default bg-[#62C073]/10 px-4 py-2">
              <Loader2 className="h-3 w-3 animate-spin shrink-0" style={{ color: "#62C073" }} />
              <span className="text-[10px] truncate" style={{ color: "#62C073" }}>
                {aiStatusMessage?.status ?? "Development Plan Tools is working on your canvas…"}
              </span>
            </div>
          )}

          {/* Input area */}
          <div className="shrink-0 border-t border-border-default p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={architectTextareaRef}
                value={architectInput}
                onChange={handleArchitectInputChange}
                onKeyDown={handleArchitectKeyDown}
                placeholder="Ask Development Plan Tools…"
                disabled={isGenerating}
                className="min-h-[72px] flex-1 resize-none border-border-default bg-elevated text-xs text-copy-primary placeholder:text-copy-muted disabled:opacity-50"
                style={{ height: "72px", maxHeight: "160px", overflowY: "auto" }}
              />
              <Button
                size="icon"
                onClick={handleArchitectSend}
                disabled={!architectInput.trim() || isGenerating}
                className="h-9 w-9 shrink-0 text-white hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: !isGenerating && architectInput.trim() ? "#62C073" : undefined }}
                aria-label="Send message"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1" ref={chatScrollRef as never}>
            <div className="flex flex-col gap-3 p-3">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center gap-4 px-2 pb-4 pt-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
                    <Users className="h-6 w-6 text-copy-muted" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-copy-primary">Room Chat</p>
                    <p className="mt-1 text-xs leading-relaxed text-copy-muted">
                      Send messages to everyone in this workspace.
                    </p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} selfName={selfName} />
                ))
              )}
            </div>
          </ScrollArea>

          {chatError && (
            <div className="shrink-0 flex items-center gap-2 border-t border-border-default bg-error/5 px-4 py-2">
              <AlertCircle className="h-3 w-3 shrink-0 text-error" />
              <span className="text-[10px] text-error truncate">{chatError}</span>
            </div>
          )}

          <div className="shrink-0 border-t border-border-default p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Message the room…"
                className="min-h-[72px] flex-1 resize-none border-border-default bg-elevated text-xs text-copy-primary placeholder:text-copy-muted"
                style={{ height: "72px", maxHeight: "160px", overflowY: "auto" }}
              />
              <Button
                size="icon"
                onClick={handleChatSend}
                disabled={!chatInput.trim()}
                className="h-9 w-9 shrink-0 text-white hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: chatInput.trim() ? "#62C073" : undefined }}
                aria-label="Send chat message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="mt-0 flex min-h-0 flex-1 flex-col">
          <SpecsTab
            projectId={workspaceProject?.id ?? null}
            roomId={workspaceProject?.slug ?? null}
            chatMessages={chatMessages}
            currentUserId={currentUserId ?? null}
            fetchRef={specsFetchRef}
            removeRef={specsRemoveRef}
          />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

type SpecRunPhase = "idle" | "queued" | "running" | "done" | "failed"

const SPEC_PHASE_LABEL: Record<SpecRunPhase, string> = {
  idle: "",
  queued: "Queued — waiting for worker…",
  running: "Generating spec with AI…",
  done: "Spec ready!",
  failed: "Generation failed",
}

function SpecRunWatcher({
  runId,
  publicToken,
  onPhaseChange,
}: {
  runId: string
  publicToken: string
  onPhaseChange: (phase: SpecRunPhase) => void
}) {
  const { run } = useRealtimeRun(runId, { accessToken: publicToken })
  const phaseRef = useRef<SpecRunPhase>("queued")

  useEffect(() => {
    if (!run) return
    let next: SpecRunPhase = phaseRef.current
    if (run.status === "QUEUED" || run.status === "PENDING_VERSION") next = "queued"
    else if (run.status === "EXECUTING" || run.status === "DEQUEUED") next = "running"
    else if (run.status === "COMPLETED") next = "done"
    else if (
      run.status === "FAILED" ||
      run.status === "CRASHED" ||
      run.status === "CANCELED" ||
      run.status === "TIMED_OUT" ||
      run.status === "SYSTEM_FAILURE"
    ) next = "failed"

    if (next !== phaseRef.current) {
      phaseRef.current = next
      onPhaseChange(next)
    }
  }, [run, onPhaseChange])

  return null
}

function SpecsTab({
  projectId,
  roomId,
  chatMessages,
  currentUserId,
  fetchRef,
  removeRef,
}: {
  projectId: string | null
  roomId: string | null
  chatMessages: ChatMessage[]
  currentUserId: string | null
  fetchRef?: React.MutableRefObject<(() => void) | null>
  removeRef?: React.MutableRefObject<((specId: string) => void) | null>
}) {
  const { canvasSnapshotRef } = useWorkspace()
  const [specs, setSpecs] = useState<ProjectSpec[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewSpec, setPreviewSpec] = useState<ProjectSpec | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Realtime run tracking
  const [specRunId, setSpecRunId] = useState<string | null>(null)
  const [specToken, setSpecToken] = useState<string | null>(null)
  const [specPhase, setSpecPhase] = useState<SpecRunPhase>("idle")

  const isGenerating = specPhase === "queued" || specPhase === "running"

  const fetchSpecs = useCallback(() => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    fetch(`/api/projects/${projectId}/specs`)
      .then((r) => r.json())
      .then((data: { specs?: ProjectSpec[]; error?: string }) => {
        if (data.error) throw new Error(data.error)
        setSpecs(data.specs ?? [])
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [projectId])

  // Expose fetchSpecs and removeSpec to parent (AiSidebar) so room events
  // can drive the list for all users, not just the one who triggered the action.
  useEffect(() => {
    if (fetchRef) fetchRef.current = fetchSpecs
  }, [fetchRef, fetchSpecs])

  useEffect(() => {
    if (!removeRef) return
    removeRef.current = (specId: string) => {
      setSpecs((prev) => prev.filter((s) => s.id !== specId))
      setPreviewSpec((prev) => (prev?.id === specId ? null : prev))
    }
  }, [removeRef])

  useEffect(() => {
    fetchSpecs()
  }, [fetchSpecs])

  const handlePhaseChange = useCallback((phase: SpecRunPhase) => {
    setSpecPhase(phase)
    if (phase === "done" || phase === "failed") {
      if (phase === "done") fetchSpecs()
      // Clear watcher after a moment so the status lingers briefly
      setTimeout(() => {
        setSpecRunId(null)
        setSpecToken(null)
        if (phase === "done") setSpecPhase("idle")
      }, 2500)
    }
  }, [fetchSpecs])

  const handleGenerateSpec = useCallback(async () => {
    if (!projectId || !roomId || isGenerating) return
    setGenerateError(null)
    setSpecPhase("queued")
    try {
      const { nodes, edges } = canvasSnapshotRef.current
      const history = chatMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory: history, nodes, edges }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? "Failed to generate spec")
      }
      const { runId } = (await res.json()) as { runId: string }

      // Fetch a scoped public token to subscribe via useRealtimeRun
      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      })
      if (!tokenRes.ok) {
        // Token failed — fall back to a one-time delayed refresh
        console.warn("[SpecsTab] token fetch failed, falling back to delayed refresh")
        setTimeout(fetchSpecs, 15000)
        return
      }
      const { token } = (await tokenRes.json()) as { token: string }
      setSpecRunId(runId)
      setSpecToken(token)
      setSpecPhase("running")
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Unknown error")
      setSpecPhase("failed")
      setTimeout(() => setSpecPhase("idle"), 3000)
    }
  }, [projectId, roomId, isGenerating, canvasSnapshotRef, chatMessages, fetchSpecs])

  const openPreview = useCallback(async (spec: ProjectSpec) => {
    if (!projectId) return
    setPreviewSpec(spec)
    setPreviewContent(null)
    setPreviewLoading(true)
    try {
      const r = await fetch(`/api/projects/${projectId}/specs/${spec.id}/preview`)
      if (!r.ok) throw new Error("Failed to load spec")
      setPreviewContent(await r.text())
    } catch {
      setPreviewContent("Failed to load spec content.")
    } finally {
      setPreviewLoading(false)
    }
  }, [projectId])

  const handleDownload = useCallback((spec: ProjectSpec) => {
    if (!projectId) return
    const a = document.createElement("a")
    a.href = `/api/projects/${projectId}/specs/${spec.id}/download`
    a.download = `spec-${spec.id}.md`
    a.click()
  }, [projectId])

  const handleDelete = useCallback(async (spec: ProjectSpec) => {
    if (!projectId) return
    setDeletingId(spec.id)
    setConfirmDeleteId(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? "Failed to delete spec")
      }
      setSpecs((prev) => prev.filter((s) => s.id !== spec.id))
      if (previewSpec?.id === spec.id) setPreviewSpec(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete spec")
    } finally {
      setDeletingId(null)
    }
  }, [projectId, previewSpec])

  const specFilename = (spec: ProjectSpec) => {
    const parts = spec.filePath.split("/")
    return parts[parts.length - 1] ?? `spec-${spec.id}.md`
  }

  if (!projectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
        <FileText className="h-8 w-8 text-copy-muted" />
        <p className="text-xs text-copy-muted">Open a project to view specs.</p>
      </div>
    )
  }

  return (
    <>
      {/* Realtime watcher — mounts only while a run is active */}
      {specRunId && specToken && isGenerating && (
        <SpecRunWatcher
          runId={specRunId}
          publicToken={specToken}
          onPhaseChange={handlePhaseChange}
        />
      )}

      <div className="shrink-0 border-b border-border-default p-3 flex flex-col gap-2">
        <Button
          className="w-full text-white hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: specPhase === "done" ? "#4ade80" : "#62C073" }}
          onClick={handleGenerateSpec}
          disabled={isGenerating || !projectId}
        >
          {specPhase === "queued" && (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Queued…
            </>
          )}
          {specPhase === "running" && (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Generating…
            </>
          )}
          {specPhase === "done" && (
            <>
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              Spec Ready!
            </>
          )}
          {specPhase === "failed" && (
            <>
              <AlertCircle className="mr-2 h-3.5 w-3.5" />
              Failed — Retry
            </>
          )}
          {specPhase === "idle" && "Generate Spec"}
        </Button>

        {/* Status strip — visible while generating or just completed */}
        {specPhase !== "idle" && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-[10px]",
              specPhase === "done"
                ? "bg-[#62C073]/10 text-[#4ade80]"
                : specPhase === "failed"
                ? "bg-error/10 text-error"
                : "bg-[#62C073]/10 text-[#62C073]"
            )}
          >
            {specPhase === "queued" && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
            {specPhase === "running" && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
            {specPhase === "done" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
            {specPhase === "failed" && <AlertCircle className="h-3 w-3 shrink-0" />}
            <span className="truncate">{SPEC_PHASE_LABEL[specPhase]}</span>
          </div>
        )}

        {generateError && (
          <div className="flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2">
            <AlertCircle className="h-3 w-3 shrink-0 text-error" />
            <span className="text-[10px] text-error">{generateError}</span>
          </div>
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 p-3">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-copy-muted" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2">
              <AlertCircle className="h-3 w-3 shrink-0 text-error" />
              <span className="text-[10px] text-error">{error}</span>
            </div>
          )}
          {!loading && !error && specs.length === 0 && specPhase !== "running" && specPhase !== "queued" && (
            <div className="flex flex-col items-center gap-3 py-10">
              <FileText className="h-8 w-8 text-copy-muted" />
              <p className="text-xs text-copy-muted">No specs generated yet.</p>
            </div>
          )}
          {isGenerating && specs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-copy-muted" />
              <p className="text-xs text-copy-muted">
                {specPhase === "queued" ? "Waiting for worker…" : "AI is writing your spec…"}
              </p>
            </div>
          )}
          {specs.map((spec) => {
            const isOwner = currentUserId === spec.creatorId
            const isDeleting = deletingId === spec.id
            const isConfirming = confirmDeleteId === spec.id

            return (
              <div key={spec.id} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => openPreview(spec)}
                  disabled={isDeleting}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border-default bg-elevated px-3 py-2.5 text-left transition-colors hover:bg-subtle disabled:opacity-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-subtle group-hover:bg-border-default">
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-copy-muted" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-copy-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-copy-primary">
                      {specFilename(spec)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-copy-muted">
                      {new Date(spec.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); handleDownload(spec) }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); handleDownload(spec) } }}
                      className="rounded p-1 text-copy-muted transition-colors hover:text-copy-primary"
                      aria-label="Download spec"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </div>
                    {isOwner && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(isConfirming ? null : spec.id) }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setConfirmDeleteId(isConfirming ? null : spec.id) } }}
                        className="rounded p-1 text-copy-muted transition-colors hover:text-error"
                        aria-label="Delete spec"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Inline confirm row */}
                {isConfirming && (
                  <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2">
                    <AlertCircle className="h-3 w-3 shrink-0 text-error" />
                    <span className="flex-1 text-[10px] text-error">Delete this spec?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(spec)}
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-white transition-colors"
                      style={{ backgroundColor: "#ef4444" }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-copy-muted transition-colors hover:text-copy-primary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <Dialog open={!!previewSpec} onOpenChange={(open) => { if (!open) setPreviewSpec(null) }}>
        <DialogContent className="flex max-h-[85vh] w-[92vw] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111318] p-0 shadow-2xl [&>button:last-child]:hidden">
          {/* Header */}
          <DialogHeader className="shrink-0 px-0 py-0">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
              {/* File icon + name */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                <FileText className="h-4 w-4 text-[#62C073]" />
              </div>
              <DialogTitle className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-white">
                  {previewSpec ? specFilename(previewSpec) : ""}
                </p>
                <p className="text-[10px] text-white/40">Technical Specification</p>
              </DialogTitle>

              {/* Download button */}
              {previewSpec && (
                <button
                  type="button"
                  onClick={() => handleDownload(previewSpec)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#74d984" }}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Download
                </button>
              )}

              {/* Delete button — only for spec creator */}
              {previewSpec && currentUserId === previewSpec.creatorId && (
                confirmDeleteId === `modal-${previewSpec.id}` ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(previewSpec)}
                      disabled={deletingId === previewSpec.id}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: "#ef4444" }}
                    >
                      {deletingId === previewSpec.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/40 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(`modal-${previewSpec.id}`)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-error/20 hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )
              )}

              {/* Close button — sits right of download, matching Radix's own X */}
              <button
                type="button"
                onClick={() => setPreviewSpec(null)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#0d1117]">
            <div className="px-7 py-6">
              {previewLoading && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-white/30" />
                  <p className="text-xs text-white/30">Loading spec…</p>
                </div>
              )}
              {!previewLoading && previewContent && (
                <div className="prose prose-invert prose-sm max-w-none leading-relaxed
                  text-white/75
                  [&_h1]:mb-3 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-white
                  [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white
                  [&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-white/90
                  [&_p]:mb-3 [&_p]:text-[13px] [&_p]:leading-relaxed
                  [&_ul]:mb-3 [&_ul]:space-y-1 [&_ul]:pl-4
                  [&_ol]:mb-3 [&_ol]:space-y-1 [&_ol]:pl-4
                  [&_li]:text-[13px]
                  [&_strong]:font-semibold [&_strong]:text-white
                  [&_a]:text-[#62C073] [&_a]:underline-offset-2
                  [&_hr]:my-5 [&_hr]:border-white/[0.06]
                  [&_code]:rounded-md [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[11px] [&_code]:font-mono [&_code]:text-[#62C073]
                  [&_pre]:rounded-xl [&_pre]:bg-white/[0.05] [&_pre]:p-4 [&_pre]:text-[11px]
                  [&_blockquote]:border-l-2 [&_blockquote]:border-[#62C073]/40 [&_blockquote]:pl-4 [&_blockquote]:text-white/50
                ">
                  <ReactMarkdown>{previewContent}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ChatBubble({ msg, selfName }: { msg: ChatMessage; selfName?: string }) {
  const isSelf = msg.role === "user" && !!selfName && msg.sender === selfName
  const isAI = msg.role === "assistant"
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  if (isAI) {
    return (
      <div className="flex flex-col gap-0.5 items-start">
        <span className="text-[10px] text-copy-muted px-1">{msg.sender} · {time}</span>
        <div className="max-w-[85%] rounded-2xl border border-border-default bg-elevated px-3 py-2 text-xs text-copy-secondary">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-0.5", isSelf ? "items-end" : "items-start")}>
      <span className="text-[10px] text-copy-muted px-1">{msg.sender} · {time}</span>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-xs",
          isSelf
            ? "font-medium text-white"
            : "border border-border-default bg-elevated text-copy-secondary"
        )}
        style={isSelf ? { backgroundColor: "#62C073" } : undefined}
      >
        {msg.content}
      </div>
    </div>
  )
}

function AssistantBubbleContent({
  content,
  isLastMessage,
  isGenerating,
}: {
  content: string
  isLastMessage: boolean
  isGenerating: boolean
}) {
  // Show spinner on the last assistant message while run is still active
  if (isLastMessage && isGenerating) {
    return (
      <span className="flex items-center gap-1.5 text-ai">
        <Loader2 className="h-3 w-3 animate-spin" />
        {content}
      </span>
    )
  }
  if (content.startsWith("Done!")) {
    return (
      <span className="flex items-center gap-1.5 text-success">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        {content}
      </span>
    )
  }
  if (content.includes("went wrong") || content.includes("Failed")) {
    return (
      <span className="flex items-center gap-1.5 text-error">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {content}
      </span>
    )
  }
  return <>{content}</>
}
