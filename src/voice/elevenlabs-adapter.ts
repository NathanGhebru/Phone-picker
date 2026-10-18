import type { Language } from "@/shared/types";
import type { ProviderSession, VoiceAdapter, VoiceAdapterStartOptions } from "./types";

type ElevenLabsSession = ProviderSession;

/**
 * Typed only to the official @elevenlabs/client surface used here. Keeping the
 * SDK injection explicit lets this worktree type-check before its owner adds the
 * shared dependency, while production still calls Conversation.startSession.
 */
export interface ElevenLabsConversationSdk {
  startSession(options: ElevenLabsStartSessionOptions): Promise<ElevenLabsSession>;
}

export interface ElevenLabsStartSessionOptions {
  signedUrl: string;
  connectionType: "websocket";
  overrides: { agent: { language: Language } };
  onConnect(): void;
  onDisconnect(): void;
  onMessage(message: unknown): void;
  onError(error: unknown): void;
  onModeChange(mode: { mode: "listening" | "speaking" } | "listening" | "speaking"): void;
  onStatusChange(event: { status: "connecting" | "connected" | "disconnected" | "disconnecting" }): void;
}

export interface SessionAuthorizer {
  createSession(language: Language): Promise<{ signedUrl: string }>;
}

export function createElevenLabsVoiceAdapter(
  conversation: ElevenLabsConversationSdk,
  authorizer: SessionAuthorizer = createHttpSessionAuthorizer(),
): VoiceAdapter {
  return {
    async start(options: VoiceAdapterStartOptions): Promise<ProviderSession> {
      const { signedUrl } = await authorizer.createSession(options.language);
      return conversation.startSession({
        signedUrl,
        // Signed URLs authorize the official SDK's WebSocket connection.
        connectionType: "websocket",
        overrides: { agent: { language: options.language } },
        onConnect: options.onConnected,
        onDisconnect: options.onDisconnected,
        onMessage: options.onMessage,
        onError: options.onError,
        onModeChange: (mode) => {
          const value = typeof mode === "string" ? mode : mode.mode;
          if (value === "listening" || value === "speaking") options.onMode(value);
        },
        onStatusChange: ({ status }) => {
          if (status === "connecting" || status === "connected" || status === "disconnected") {
            options.onConnectionState(status);
          }
        },
      });
    },
  };
}

export function createHttpSessionAuthorizer(fetcher: typeof fetch = fetch): SessionAuthorizer {
  return {
    async createSession(language: Language): Promise<{ signedUrl: string }> {
      const response = await fetcher("/api/voice/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ language }),
      });
      if (!response.ok) throw new Error("Voice session authorization failed.");
      const payload: unknown = await response.json();
      if (!isSessionResponse(payload)) throw new Error("Voice session authorization failed.");
      return { signedUrl: payload.signedUrl };
    },
  };
}

function isSessionResponse(value: unknown): value is { signedUrl: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "signedUrl" in value &&
    typeof value.signedUrl === "string" &&
    value.signedUrl.length > 0
  );
}
