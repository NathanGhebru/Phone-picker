import type { Language } from "@/shared/types";
import type { ProviderSession, VoiceAdapter, VoiceAdapterStartOptions } from "./types";

export interface MockVoiceAdapter extends VoiceAdapter {
  readonly starts: Language[];
  readonly endedSessions: number;
  emitMessage(message: unknown): void;
  emitMode(mode: "listening" | "speaking"): void;
  emitError(error: unknown): void;
  disconnect(): void;
}

/** Deterministic provider replacement for unit and UI integration tests. */
export function createMockVoiceAdapter(options: { failStart?: unknown } = {}): MockVoiceAdapter {
  let handlers: VoiceAdapterStartOptions | null = null;
  let endedSessions = 0;
  const starts: Language[] = [];

  return {
    starts,
    get endedSessions() {
      return endedSessions;
    },
    async start(startOptions) {
      starts.push(startOptions.language);
      handlers = startOptions;
      if (options.failStart) throw options.failStart;
      startOptions.onConnectionState("connecting");
      startOptions.onConnected();
      return {
        async endSession() {
          endedSessions += 1;
          startOptions.onDisconnected();
        },
      } satisfies ProviderSession;
    },
    emitMessage(message) {
      handlers?.onMessage(message);
    },
    emitMode(mode) {
      handlers?.onMode(mode);
    },
    emitError(error) {
      handlers?.onError(error);
    },
    disconnect() {
      handlers?.onDisconnected();
    },
  };
}
