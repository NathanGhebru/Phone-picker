import type { AppEvent, Language } from "@/shared/types";
import { normalizeProviderMessage, transcriptDedupeKey } from "./event-normalizer";
import type {
  ConfirmedUserTurn,
  MicrophonePermission,
  ProviderSession,
  VoiceAdapter,
  VoiceConnectionState,
  VoiceController,
} from "./types";

const DUPLICATE_WINDOW_MS = 2_000;

export class VoiceSessionController implements VoiceController {
  private readonly eventListeners = new Set<(event: AppEvent) => void>();
  private readonly turnListeners = new Set<(turn: ConfirmedUserTurn) => void>();
  private readonly recentlyConfirmedTurns = new Map<string, number>();
  private session: ProviderSession | null = null;
  private state: VoiceConnectionState = "idle";
  private language: Language | null = null;
  private startGeneration = 0;

  constructor(
    private readonly adapter: VoiceAdapter,
    private readonly requestMicrophonePermission: MicrophonePermission = requestBrowserMicrophonePermission,
    private readonly now: () => number = Date.now,
  ) {}

  subscribe(listener: (event: AppEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  subscribeConfirmedTurns(listener: (turn: ConfirmedUserTurn) => void): () => void {
    this.turnListeners.add(listener);
    return () => this.turnListeners.delete(listener);
  }

  async start(language: Language): Promise<void> {
    if (this.session || this.state === "connecting") await this.stop();

    const generation = ++this.startGeneration;
    this.language = language;
    this.emit({ type: "language_changed", language });
    this.setState("connecting");

    try {
      await this.requestMicrophonePermission();
      if (generation !== this.startGeneration) return;

      let disconnectedBeforeSessionWasStored = false;
      const handleDisconnect = () => {
        if (generation !== this.startGeneration) return;
        disconnectedBeforeSessionWasStored = true;
        this.session = null;
        this.setState("idle");
      };
      const session = await this.adapter.start({
        language,
        onConnected: () => {
          if (generation === this.startGeneration) this.setState("listening");
        },
        onDisconnected: handleDisconnect,
        onConnectionState: (connectionState) => {
          if (generation !== this.startGeneration) return;
          if (connectionState === "connecting") this.setState("connecting");
          if (connectionState === "connected") this.setState("listening");
          if (connectionState === "disconnected") handleDisconnect();
        },
        onMode: (mode) => {
          if (generation === this.startGeneration) this.setState(mode);
        },
        onMessage: (message) => this.handleProviderMessage(generation, language, message),
        onError: (error) => {
          if (generation === this.startGeneration) this.setState("error", publicVoiceError(error));
        },
      });

      if (generation !== this.startGeneration || disconnectedBeforeSessionWasStored) {
        await session.endSession();
        return;
      }
      this.session = session;
    } catch (error) {
      if (generation === this.startGeneration) this.setState("error", publicVoiceError(error));
    }
  }

  async stop(): Promise<void> {
    ++this.startGeneration;
    const session = this.session;
    this.session = null;
    this.recentlyConfirmedTurns.clear();

    try {
      await session?.endSession();
    } catch {
      // Ending is best-effort; the browser must still return to a usable idle state.
    } finally {
      this.setState("idle");
    }
  }

  private handleProviderMessage(generation: number, language: Language, rawMessage: unknown): void {
    if (generation !== this.startGeneration) return;
    const event = normalizeProviderMessage(rawMessage);
    if (!event) return;

    this.emit(event);
    if (event.speaker !== "user" || !event.final) return;

    const key = transcriptDedupeKey(rawMessage, event);
    const now = this.now();
    const previous = this.recentlyConfirmedTurns.get(key);
    this.recentlyConfirmedTurns.set(key, now);
    for (const [candidate, timestamp] of this.recentlyConfirmedTurns) {
      if (now - timestamp > DUPLICATE_WINDOW_MS) this.recentlyConfirmedTurns.delete(candidate);
    }
    if (previous !== undefined && now - previous <= DUPLICATE_WINDOW_MS) return;

    for (const listener of this.turnListeners) listener({ text: event.text, language });
  }

  private emit(event: AppEvent): void {
    for (const listener of this.eventListeners) listener(event);
  }

  private setState(state: VoiceConnectionState, message?: string): void {
    if (this.state === state && message === undefined) return;
    this.state = state;
    this.emit({ type: "listening_state", state, ...(message ? { message } : {}) });
  }
}

export async function requestBrowserMicrophonePermission(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is unavailable in this browser.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // This is a preflight permission request only. The SDK owns its own audio stream.
  stream.getTracks().forEach((track) => track.stop());
}

function publicVoiceError(error: unknown): string {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Microphone permission was denied. You can continue by typing.";
    }
    if (error.name === "NotFoundError") return "No microphone was found. You can continue by typing.";
  }
  return "Voice connection could not start. Please try again or continue by typing.";
}
