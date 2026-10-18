import type { AppEvent, Language } from "@/shared/types";

export type VoiceConnectionState = Extract<
  AppEvent,
  { type: "listening_state" }
>["state"];

/** The small subset of the ElevenLabs session object used by this transport. */
export interface ProviderSession {
  endSession(): Promise<void> | void;
}

/** Matches the client-tools callback shape accepted by @elevenlabs/client. */
export type VoiceClientTool = (
  parameters: Record<string, unknown>,
) => string | number | void | Promise<string | number | void>;

export type VoiceClientTools = Record<string, VoiceClientTool>;

/**
 * Provider-neutral adapter boundary. The UI and session controller never receive
 * ElevenLabs SDK objects or raw provider callback payloads.
 */
export interface VoiceAdapter {
  start(options: VoiceAdapterStartOptions): Promise<ProviderSession>;
}

export interface VoiceAdapterStartOptions {
  language: Language;
  /** Optional frontend-owned actions that ElevenLabs may invoke during this session. */
  clientTools?: VoiceClientTools;
  onConnected(): void;
  onDisconnected(): void;
  onConnectionState(state: "connecting" | "connected" | "disconnected"): void;
  onMode(mode: "listening" | "speaking"): void;
  onMessage(message: unknown): void;
  onError(error: unknown): void;
}

export interface VoiceSessionStartOptions {
  clientTools?: VoiceClientTools;
}

export interface ConfirmedUserTurn {
  text: string;
  language: Language;
}

export interface VoiceController {
  start(language: Language, options?: VoiceSessionStartOptions): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (event: AppEvent) => void): () => void;
  subscribeConfirmedTurns(listener: (turn: ConfirmedUserTurn) => void): () => void;
}

export type MicrophonePermission = () => Promise<void>;
