import { NODE_COLORS, type CanvasNode, type CanvasEdge } from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

function n(
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  shape: CanvasNode["data"]["shape"],
  colorIdx: number,
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, shape, color: NODE_COLORS[colorIdx].fill },
    width: w,
    height: h,
  }
}

function e(id: string, source: string, target: string): CanvasEdge {
  return { id, type: "canvasEdge", source, target, sourceHandle: null, targetHandle: null, data: {} }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description: "API gateway routing to independent services with dedicated databases and a message bus.",
    nodes: [
      n("ms-gw",  "API Gateway",      280,   0, 160, 60, "rectangle", 1),
      n("ms-us",  "User Service",      80, 120, 140, 60, "rectangle", 2),
      n("ms-os",  "Order Service",    280, 120, 140, 60, "rectangle", 3),
      n("ms-ps",  "Product Service",  480, 120, 140, 60, "rectangle", 6),
      n("ms-udb", "Users DB",          80, 240, 100, 80, "cylinder",  1),
      n("ms-odb", "Orders DB",        280, 240, 100, 80, "cylinder",  3),
      n("ms-pdb", "Products DB",      480, 240, 100, 80, "cylinder",  6),
      n("ms-bus", "Message Bus",      280, 370, 140, 60, "hexagon",   7),
    ],
    edges: [
      e("ms-e1", "ms-gw",  "ms-us"),
      e("ms-e2", "ms-gw",  "ms-os"),
      e("ms-e3", "ms-gw",  "ms-ps"),
      e("ms-e4", "ms-us",  "ms-udb"),
      e("ms-e5", "ms-os",  "ms-odb"),
      e("ms-e6", "ms-ps",  "ms-pdb"),
      e("ms-e7", "ms-os",  "ms-bus"),
    ],
  },
  {
    id: "cicd",
    name: "CI/CD Pipeline",
    description: "Source code through build, test, and staged deployment to production with monitoring.",
    nodes: [
      n("ci-src",   "Source Control",    0,  60, 140, 60, "rectangle", 1),
      n("ci-build", "Build",           180,  60, 120, 60, "rectangle", 3),
      n("ci-test",  "Test Suite",      340,  60, 120, 60, "rectangle", 4),
      n("ci-stage", "Deploy Staging",  500,  60, 140, 60, "pill",      7),
      n("ci-prod",  "Production",      680,  60, 140, 60, "pill",      6),
      n("ci-art",   "Artifact Store",  180, 180, 120, 70, "cylinder",  1),
      n("ci-mon",   "Monitoring",      680, 180, 140, 60, "hexagon",   2),
    ],
    edges: [
      e("ci-e1", "ci-src",   "ci-build"),
      e("ci-e2", "ci-build", "ci-test"),
      e("ci-e3", "ci-test",  "ci-stage"),
      e("ci-e4", "ci-stage", "ci-prod"),
      e("ci-e5", "ci-build", "ci-art"),
      e("ci-e6", "ci-prod",  "ci-mon"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description: "Producers publish to a shared event bus consumed by independent services.",
    nodes: [
      n("ev-p1",  "Producer A",    0,  60, 120, 60, "rectangle", 1),
      n("ev-p2",  "Producer B",    0, 160, 120, 60, "rectangle", 2),
      n("ev-bus", "Event Bus",   180, 110, 140, 60, "hexagon",   7),
      n("ev-c1",  "Consumer A",  380,  20, 120, 60, "rectangle", 3),
      n("ev-c2",  "Consumer B",  380, 110, 120, 60, "rectangle", 6),
      n("ev-c3",  "Consumer C",  380, 200, 120, 60, "rectangle", 4),
      n("ev-dlq", "Dead Letter", 560, 110, 120, 70, "cylinder",  4),
    ],
    edges: [
      e("ev-e1", "ev-p1",  "ev-bus"),
      e("ev-e2", "ev-p2",  "ev-bus"),
      e("ev-e3", "ev-bus", "ev-c1"),
      e("ev-e4", "ev-bus", "ev-c2"),
      e("ev-e5", "ev-bus", "ev-c3"),
      e("ev-e6", "ev-c3",  "ev-dlq"),
    ],
  },
]
