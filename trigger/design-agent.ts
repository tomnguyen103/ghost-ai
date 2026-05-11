import { task } from "@trigger.dev/sdk/v3";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getLiveblocksClient } from "@/lib/liveblocks";
import { mutateFlow } from "@liveblocks/react-flow/node";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

const AI_USER_ID = "ghost-ai";
const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#a78bfa",
};

const PRESENCE_TTL_MS = 5_000;

const ShapeEnum = z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]);

// Tool input schemas — one per canvas action
const AddNodeInput = z.object({
  id: z.string().describe("Short unique ID like n1, n2, etc."),
  label: z.string().describe("Short clear name, 1-4 words, no punctuation"),
  shape: ShapeEnum,
  colorIndex: z
    .number()
    .int()
    .min(0)
    .max(7)
    .describe("0=dark 1=blue 2=purple 3=orange 4=red 5=pink 6=green 7=teal"),
  x: z.number().describe("X position, 0-1200"),
  y: z.number().describe("Y position, 0-800"),
  width: z.number().optional(),
  height: z.number().optional(),
});
const MoveNodeInput = z.object({ id: z.string(), x: z.number(), y: z.number() });
const ResizeNodeInput = z.object({ id: z.string(), width: z.number(), height: z.number() });
const UpdateNodeDataInput = z.object({
  id: z.string(),
  label: z.string().optional(),
  shape: ShapeEnum.optional(),
  colorIndex: z.number().int().min(0).max(7).optional(),
});
const DeleteNodeInput = z.object({ id: z.string() });
const AddEdgeInput = z.object({
  id: z.string().describe("Short unique ID like e1, e2, etc."),
  source: z.string().describe("Node ID of the source"),
  target: z.string().describe("Node ID of the target"),
  label: z.string().optional().describe("Short description of the connection"),
});
const DeleteEdgeInput = z.object({ id: z.string() });

type AddNodeArgs = z.infer<typeof AddNodeInput>;
type MoveNodeArgs = z.infer<typeof MoveNodeInput>;
type ResizeNodeArgs = z.infer<typeof ResizeNodeInput>;
type UpdateNodeDataArgs = z.infer<typeof UpdateNodeDataInput>;
type DeleteNodeArgs = z.infer<typeof DeleteNodeInput>;
type AddEdgeArgs = z.infer<typeof AddEdgeInput>;
type DeleteEdgeArgs = z.infer<typeof DeleteEdgeInput>;

type ToolCall =
  | { toolName: "add_node"; input: AddNodeArgs }
  | { toolName: "move_node"; input: MoveNodeArgs }
  | { toolName: "resize_node"; input: ResizeNodeArgs }
  | { toolName: "update_node_data"; input: UpdateNodeDataArgs }
  | { toolName: "delete_node"; input: DeleteNodeArgs }
  | { toolName: "add_edge"; input: AddEdgeArgs }
  | { toolName: "delete_edge"; input: DeleteEdgeArgs };

// Canvas tools — no execute needed; we apply them ourselves in mutateFlow
const canvasTools = {
  add_node: tool({
    description:
      "Add a new node to the canvas. Use rectangle for services/APIs, cylinder for databases/storage, diamond for decisions, circle for events/triggers, hexagon for external systems, pill for queues/streams.",
    inputSchema: AddNodeInput,
  }),
  move_node: tool({
    description: "Move an existing node to a new position.",
    inputSchema: MoveNodeInput,
  }),
  resize_node: tool({
    description: "Resize an existing node.",
    inputSchema: ResizeNodeInput,
  }),
  update_node_data: tool({
    description: "Update the label, shape, or color of an existing node.",
    inputSchema: UpdateNodeDataInput,
  }),
  delete_node: tool({
    description: "Remove a node from the canvas.",
    inputSchema: DeleteNodeInput,
  }),
  add_edge: tool({
    description:
      "Connect two nodes with a directed edge. Both source and target must already exist on the canvas or have been added via add_node in this session.",
    inputSchema: AddEdgeInput,
  }),
  delete_edge: tool({
    description: "Remove an edge from the canvas.",
    inputSchema: DeleteEdgeInput,
  }),
};

async function broadcastStatus(
  client: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
  status: string,
  step: "start" | "processing" | "complete" | "error"
) {
  try {
    await client.broadcastEvent(roomId, { type: "ai-status", status, step } as never);
  } catch {
    // Non-fatal
  }
}

async function setAiPresence(
  client: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
  cursor: { x: number; y: number } | null,
  thinking: boolean,
  ttl?: number
) {
  try {
    await client.setPresence(roomId, {
      userId: AI_USER_ID,
      userInfo: AI_USER_INFO,
      data: { cursor, thinking },
      ...(ttl !== undefined ? { ttl } : {}),
    });
  } catch {
    // Non-fatal
  }
}

export const designAgent = task({
  id: "design-agent",
  retry: { maxAttempts: 2 },
  run: async (payload: { prompt: string; roomId: string }) => {
    const { prompt, roomId } = payload;
    const client = getLiveblocksClient();

    await setAiPresence(client, roomId, { x: 400, y: 300 }, true);
    await broadcastStatus(client, roomId, "Ghost AI is thinking…", "start");

    let currentNodes: readonly CanvasNode[] = [];
    let currentEdges: readonly CanvasEdge[] = [];
    try {
      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        currentNodes = flow.nodes;
        currentEdges = flow.edges;
      });
    } catch {
      // Empty canvas — start fresh
    }

    let toolCalls: ToolCall[] = [];
    try {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      const result = await generateText({
        model: google("gemini-2.5-flash"),
        stopWhen: stepCountIs(10),
        tools: canvasTools,
        toolChoice: "required",
        system: buildSystemPrompt(currentNodes, currentEdges),
        prompt,
      });

      // Collect typed tool calls across all steps, filtering to our known set
      for (const step of result.steps) {
        for (const call of step.toolCalls) {
          if (call.toolName in canvasTools) {
            toolCalls.push(call as unknown as ToolCall);
          }
        }
      }
    } catch (err) {
      await broadcastStatus(
        client,
        roomId,
        "Ghost AI encountered an error generating the design.",
        "error"
      );
      await setAiPresence(client, roomId, null, false, PRESENCE_TTL_MS);
      throw err;
    }

    if (toolCalls.length === 0) {
      await broadcastStatus(
        client,
        roomId,
        "Ghost AI did not produce any canvas actions.",
        "error"
      );
      await setAiPresence(client, roomId, null, false, PRESENCE_TTL_MS);
      return { actionCount: 0, addedNodes: 0, addedEdges: 0 };
    }

    await broadcastStatus(client, roomId, "Ghost AI is updating the canvas…", "processing");

    try {
      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        // Apply non-edge operations first so all nodes exist before edges reference them
        const edgeCalls: ToolCall[] = [];
        for (const call of toolCalls) {
          switch (call.toolName) {
            case "add_node": {
              const op = call.input;
              const colorPair = NODE_COLORS[op.colorIndex] ?? NODE_COLORS[0];
              const defaultSize = shapeDefaultSize(op.shape);
              flow.addNode({
                id: op.id,
                type: "canvasNode",
                position: { x: op.x, y: op.y },
                data: { label: op.label, shape: op.shape, color: colorPair.fill },
                width: op.width ?? defaultSize.width,
                height: op.height ?? defaultSize.height,
              } as CanvasNode);
              break;
            }
            case "move_node": {
              const op = call.input;
              flow.updateNode(op.id, { position: { x: op.x, y: op.y } });
              break;
            }
            case "resize_node": {
              const op = call.input;
              flow.updateNode(op.id, { width: op.width, height: op.height });
              break;
            }
            case "update_node_data": {
              const op = call.input;
              const partial: Partial<CanvasNode["data"]> = {};
              if (op.label !== undefined) partial.label = op.label;
              if (op.shape !== undefined) partial.shape = op.shape;
              if (op.colorIndex !== undefined) {
                const colorPair = NODE_COLORS[op.colorIndex] ?? NODE_COLORS[0];
                partial.color = colorPair.fill;
              }
              if (Object.keys(partial).length > 0) {
                flow.updateNodeData(op.id, partial);
              }
              break;
            }
            case "delete_node": {
              flow.removeNode(call.input.id);
              break;
            }
            case "add_edge":
            case "delete_edge": {
              edgeCalls.push(call);
              break;
            }
          }
        }
        // Apply edge operations after all node operations
        for (const call of edgeCalls) {
          if (call.toolName === "add_edge") {
            const op = call.input;
            flow.addEdge({
              id: op.id,
              type: "canvasEdge",
              source: op.source,
              target: op.target,
              data: { label: op.label ?? "" },
            } as CanvasEdge);
          } else if (call.toolName === "delete_edge") {
            flow.removeEdge(call.input.id);
          }
        }
      });
    } catch (err) {
      await broadcastStatus(client, roomId, "Ghost AI failed to update the canvas.", "error");
      await setAiPresence(client, roomId, null, false, PRESENCE_TTL_MS);
      throw err;
    }

    await broadcastStatus(client, roomId, "Ghost AI finished the design.", "complete");
    await setAiPresence(client, roomId, null, false, PRESENCE_TTL_MS);

    const addedNodes = toolCalls.filter((c) => c.toolName === "add_node").length;
    const addedEdges = toolCalls.filter((c) => c.toolName === "add_edge").length;
    return { actionCount: toolCalls.length, addedNodes, addedEdges };
  },
});

function shapeDefaultSize(shape: string): { width: number; height: number } {
  switch (shape) {
    case "circle":
      return { width: 80, height: 80 };
    case "diamond":
      return { width: 140, height: 140 };
    case "cylinder":
      return { width: 100, height: 100 };
    case "hexagon":
      return { width: 120, height: 120 };
    case "pill":
      return { width: 160, height: 60 };
    default:
      return { width: 160, height: 80 };
  }
}

function buildSystemPrompt(
  currentNodes: readonly CanvasNode[],
  currentEdges: readonly CanvasEdge[]
): string {
  const hasExisting = currentNodes.length > 0;

  const existingContext = hasExisting
    ? `Current canvas state:
Nodes: ${JSON.stringify(
        currentNodes.map((n) => ({
          id: n.id,
          label: n.data.label,
          shape: n.data.shape,
          x: Math.round(n.position.x),
          y: Math.round(n.position.y),
          width: n.width,
          height: n.height,
        }))
      )}
Edges: ${JSON.stringify(
        currentEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label,
        }))
      )}`
    : "The canvas is currently empty.";

  return `You are Ghost AI, an expert system architect. The user will describe a system or architecture and you must visualize it on a collaborative canvas by calling the available tools.

${existingContext}

Rules:
- Call add_node and add_edge tools to build the diagram. You may also call move_node, resize_node, update_node_data, delete_node, delete_edge when editing existing content.
- New node IDs must be short strings like "n1", "n2", etc. — never reuse existing IDs.
- New edge IDs must be short strings like "e1", "e2", etc. — never reuse existing IDs.
- All add_edge source/target values must reference node IDs that exist (either already on canvas or added via add_node in this session).
- Positions: x values 0–1200, y values 0–800. Space nodes at least 200px apart.
- Shapes: rectangle=services/APIs, cylinder=databases/storage, diamond=decisions, circle=events/triggers, hexagon=external systems, pill=queues/streams.
- colorIndex: 0=dark 1=blue 2=purple 3=orange 4=red 5=pink 6=green 7=teal. Use variety.
- Labels: short, clear names (1–4 words). No punctuation.
- If the canvas has existing nodes, prefer targeted edits over recreating everything.
- Do NOT create duplicate IDs.
- Do NOT reference node IDs that don't exist on the canvas or haven't been added via add_node in this session.
- Call all tools needed to fully represent the described architecture before finishing.`;
}
