"use client"

import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from "react"
import { Bot, X, FileText, Download, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ])
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "72px"
    }
  }, [input])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleChip = useCallback((chip: string) => {
    setInput(chip)
    textareaRef.current?.focus()
  }, [])

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = "72px"
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px"
  }, [])

  return (
    <aside
      className={cn(
        "absolute right-0 top-0 bottom-0 z-30 flex w-80 flex-col border-l border-border-default bg-base/95 backdrop-blur-md shadow-xl overflow-hidden transition-transform duration-200",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border-default px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ai/10">
          <Bot className="h-4 w-4 text-ai" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-none">
          <span className="text-sm font-semibold text-copy-primary">AI Workspace</span>
          <span className="text-[10px] text-copy-muted">Collaborate with Ghost AI</span>
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
            value="specs"
            className="flex-1 rounded-none border-b-2 border-transparent py-2.5 text-xs font-medium text-copy-muted transition-none data-[state=active]:border-brand data-[state=active]:bg-brand-dim data-[state=active]:text-brand"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="mt-0 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 p-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-4 px-2 pb-4 pt-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/10">
                    <Bot className="h-6 w-6 text-ai" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-copy-primary">Ghost AI Architect</p>
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
                messages.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl border-2 border-brand/50 bg-brand-dim px-3 py-2 text-xs text-copy-primary">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl border border-border-default bg-elevated px-3 py-2 text-xs text-copy-secondary">
                        {msg.content}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="shrink-0 border-t border-border-default p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI..."
                className="min-h-[72px] flex-1 resize-none border-border-default bg-elevated text-xs text-copy-primary placeholder:text-copy-muted"
                style={{ height: "72px", maxHeight: "160px", overflowY: "auto" }}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-9 w-9 shrink-0 bg-brand text-base hover:bg-brand/90 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="mt-0 flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-3 p-3">
            <Button className="w-full bg-brand text-base hover:bg-brand/90">
              Generate Spec
            </Button>

            {/* Demo spec card */}
            <div className="rounded-2xl border border-border-default bg-elevated p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle">
                  <FileText className="h-4 w-4 text-copy-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-copy-primary">System Architecture Spec</p>
                  <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-copy-muted">
                    Defines the core services, their responsibilities, and interaction patterns for
                    the system. Includes API boundaries, data flow, and scalability considerations.
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-copy-muted">v1.0 · 2 min ago</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 cursor-not-allowed text-copy-muted opacity-40"
                      disabled
                      aria-label="Download spec"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
