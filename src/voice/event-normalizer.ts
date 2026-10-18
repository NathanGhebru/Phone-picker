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

/**
 * Converts the documented ElevenLabs callback shape ({ source, message }) into
 * the application contract. User transcripts without an explicit final marker
 * remain interim. Agent replies are treated as complete unless the SDK explicitly
 * tells us otherwise; only confirmed *user* turns are forwarded downstream.
 */
export function normalizeProviderMessage(message: unknown): NormalizedTranscript | null {
  const record = asRecord(message);
  if (!record) return null;

  const source = record.source;
  const speaker = source === "user" ? "user" : source === "ai" || source === "assistant" ? "assistant" : null;
  const text = firstString(record, ["message", "text", "transcript"]);
  if (!speaker || !text) return null;

  const explicitFinal = firstBoolean(record, ["isFinal", "is_final", "final"]);
  return {
    type: "transcript",
    speaker,
    text,
    final: explicitFinal ?? speaker === "assistant",
  };
}

/** Stable provider IDs are preferred; the text fallback is only for short-lived dedupe. */
export function transcriptDedupeKey(message: unknown, event: NormalizedTranscript): string {
  const record = asRecord(message);
  const id = record && firstString(record, ["messageId", "message_id", "turnId", "turn_id", "id"]);
  return id ? `id:${id}` : `text:${event.text.toLocaleLowerCase()}`;
}
