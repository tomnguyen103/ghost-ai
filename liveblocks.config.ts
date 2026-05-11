declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {};

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent:
      | { type: "ai-status"; status: string; step: "start" | "processing" | "complete" | "error"; text?: string }
      | { type: "ai-chat"; id: string; sender: string; role: "user" | "assistant"; content: string; timestamp: number }
      | { type: "project-deleted" }
      | { type: "spec-created"; specId: string }
      | { type: "spec-deleted"; specId: string };

    ThreadMetadata: {};

    RoomInfo: {};
  }
}

export {};
