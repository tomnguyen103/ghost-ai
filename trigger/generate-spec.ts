import { task, logger, metadata } from "@trigger.dev/sdk/v3";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getLiveblocksClient } from "@/lib/liveblocks";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const PayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  creatorId: z.string().min(1),
  chatHistory: z.array(ChatMessageSchema),
  nodes: z.array(z.record(z.string(), z.unknown())),
  edges: z.array(z.record(z.string(), z.unknown())),
});

export const generateSpec = task({
  id: "generate-spec",
  retry: { maxAttempts: 2 },
  run: async (rawPayload: unknown) => {
    const parsed = PayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new Error(`Invalid payload: ${parsed.error.issues[0]?.message}`);
    }

    const { projectId, roomId, creatorId, chatHistory, nodes, edges } = parsed.data;

    logger.info("generate-spec started", { projectId, roomId, nodeCount: nodes.length, edgeCount: edges.length });
    metadata.set("status", "start");

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const systemPrompt = buildSystemPrompt(nodes, edges, chatHistory);

    metadata.set("status", "processing");

    let spec: string;
    try {
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        system: systemPrompt,
        prompt: "Generate a comprehensive Markdown technical specification based on the canvas architecture and the conversation history above.",
      });
      spec = result.text;
    } catch (err) {
      metadata.set("status", "error");
      logger.error("generate-spec Gemini call failed", { error: String(err) });
      throw err;
    }

    let specId: string | undefined;
    try {
      const blob = await put(
        `specs/${projectId}/${Date.now()}.md`,
        spec,
        { access: "private", contentType: "text/markdown", addRandomSuffix: false, allowOverwrite: true }
      );
      const record = await prisma.projectSpec.create({
        data: { projectId, creatorId, filePath: blob.url },
      });
      specId = record.id;
      logger.info("generate-spec saved to blob", { specId, url: blob.url });

      // Notify all clients in the room so their spec lists refresh in real time.
      try {
        const liveblocks = getLiveblocksClient();
        await liveblocks.broadcastEvent(roomId, { type: "spec-created", specId: record.id });
      } catch (broadcastErr) {
        logger.warn("generate-spec broadcast failed (non-fatal)", { error: String(broadcastErr) });
      }
    } catch (err) {
      logger.error("generate-spec blob/db save failed", { error: String(err) });
    }

    metadata.set("status", "complete");
    logger.info("generate-spec complete", { specLength: spec.length });

    return { spec, specId };
  },
});

function buildSystemPrompt(
  nodes: Record<string, unknown>[],
  edges: Record<string, unknown>[],
  chatHistory: { role: "user" | "assistant"; content: string }[]
): string {
  const nodesJson = JSON.stringify(
    nodes.map((n) => ({
      id: n.id,
      label: (n.data as Record<string, unknown>)?.label,
      shape: (n.data as Record<string, unknown>)?.shape,
      position: n.position,
    })),
    null,
    2
  );

  const edgesJson = JSON.stringify(
    edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: (e.data as Record<string, unknown>)?.label,
    })),
    null,
    2
  );

  const historyText = chatHistory
    .map((m) => `${m.role === "user" ? "User" : "Development Plan tools"}: ${m.content}`)
    .join("\n");

  return `You are Development Plan tools, an expert software architect. Your task is to generate a detailed Markdown technical specification document based on the system architecture diagram and conversation history provided below.

## Canvas Architecture

### Nodes
${nodesJson}

### Edges (Connections)
${edgesJson}

## Conversation History
${historyText || "(no conversation history)"}

## Instructions

Generate a well-structured Markdown technical specification that covers:

1. **Overview** — A brief summary of the system and its purpose based on the diagram
2. **Architecture** — Describe each component (node) and its role in the system
3. **Data Flow** — Describe how data moves between components based on the edges
4. **Component Details** — For each key component: purpose, responsibilities, interfaces
5. **Integration Points** — How components connect and communicate
6. **Technical Considerations** — Key technical decisions, scalability, reliability notes

Use clear Markdown formatting with headings, bullet points, and code blocks where appropriate.
Keep the spec concise but complete — aim for a document a developer could use to understand and implement the system.`;
}
