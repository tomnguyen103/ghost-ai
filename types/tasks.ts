import { z } from "zod"

export const AiStatusFeedPayloadSchema = z.object({
  type: z.literal("ai-status"),
  status: z.string(),
  step: z.enum(["start", "processing", "complete", "error"]),
  text: z.string().optional(),
})

export type AiStatusFeedPayload = z.infer<typeof AiStatusFeedPayloadSchema>

export const ChatMessageSchema = z.object({
  type: z.literal("ai-chat"),
  id: z.string(),
  sender: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.number(),
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>
