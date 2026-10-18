import type { AppEvent, Language } from "@/shared/types";

export type VoiceConnectionState = Extract<
  AppEvent,
  { type: "listening_state" }
>["state"];

/** The small subset of the ElevenLabs session object used by this transport. */
export interface ProviderSession {
  endSession(): Promise<void> | void;
}

/**
 * Provider-neutral adapter boundary. The UI and session controller never receive
 * ElevenLabs SDK objects or raw provider callback payloads.
 */
export interface VoiceAdapter {
  start(options: VoiceAdapterStartOptions): Promise<ProviderSession>;
}

export interface VoiceAdapterStartOptions {
  language: Language;
  onConnected(): void;
  onDisconnected(): void;
  onConnectionState(state: "connecting" | "connected" | "disconnected"): void;
  onMode(mode: "listening" | "speaking"): void;
  onMessage(message: unknown): void;
  onError(error: unknown): void;
}

export interface ConfirmedUserTurn {
  text: string;
  language: Language;
}

export interface VoiceController {
  start(language: Language): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (event: AppEvent) => void): () => void;
  subscribeConfirmedTurns(listener: (turn: ConfirmedUserTurn) => void): () => void;
}

export type MicrophonePermission = () => Promise<void>;
