import type { AppEvent } from "@/shared/types";

type UnknownRecord = Record<string, unknown>;

export type NormalizedTranscript = Extract<AppEvent, { type: "transcript" }>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function firstString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function firstBoolean(record: UnknownRecord, keys: string[]): boolean | null {
  for (const key of keys) {
    if (typeof record[key] === "boolean") return record[key] as boolean;
  }
  return null;
}

function firstIdentifier(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

/**
 * Converts provider callback payloads into the application contract. The
 * @elevenlabs/client@1.27.0 `onMessage` callback emits final user transcript
 * events as `{ source: "user", role: "user", message, event_id }`, without an
 * `isFinal` property. Other user-shaped payloads remain interim unless they
 * carry an explicit final marker.
 */
export function normalizeProviderMessage(message: unknown): NormalizedTranscript | null {
  const record = asRecord(message);
  if (!record) return null;

  const source = record.source;
  const speaker = source === "user" ? "user" : source === "ai" || source === "assistant" ? "assistant" : null;
  const text = firstString(record, ["message", "text", "transcript"]);
  if (!speaker || !text) return null;

  const explicitFinal = firstBoolean(record, ["isFinal", "is_final", "final"]);
  const isElevenLabsFinalUserTranscript =
    source === "user" && record.role === "user" && typeof record.event_id === "number";
  return {
    type: "transcript",
    speaker,
    text,
    final: explicitFinal ?? (isElevenLabsFinalUserTranscript || speaker === "assistant"),
  };
}

/** Stable provider IDs are preferred; the text fallback is only for short-lived dedupe. */
export function transcriptDedupeKey(message: unknown, event: NormalizedTranscript): string {
  const record = asRecord(message);
  const id = record && firstIdentifier(record, ["messageId", "message_id", "turnId", "turn_id", "id", "event_id"]);
  return id ? `id:${id}` : `text:${event.text.toLocaleLowerCase()}`;
}
