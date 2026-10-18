import { NextRequest, NextResponse } from "next/server";
import type { Language } from "@/shared/types";

const PROVIDER_URL = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const requests = new Map<string, { count: number; resetsAt: number }>();
const CLIENT_ERROR = "Voice service is unavailable. Please try again or continue by typing.";
const PLACEHOLDER_VALUES = new Set([
  "your_private_api_key",
  "your-api-key-here",
  "your_english_agent_id",
  "your_spanish_agent_id",
  "your-agent-id-here",
]);

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return errorResponse("Voice session requests must come from this site.", 403);

  const rateLimit = consumeRateLimit(clientAddress(request));
  if (rateLimit) return errorResponse("Please wait before starting another voice session.", 429, rateLimit);

  const body: unknown = await request.json().catch(() => null);
  const language = languageFrom(body);
  if (!language) return errorResponse("Choose English or Spanish before starting voice.", 400);

  const rawApiKey = process.env.ELEVENLABS_API_KEY;
  const rawAgentId = language === "en" ? process.env.ELEVENLABS_VOICE_AGENT_ID_EN : process.env.ELEVENLABS_VOICE_AGENT_ID_ES;
  const apiKey = configuredValue(rawApiKey);
  const agentId = configuredValue(rawAgentId);

  logVoiceSession("info", {
    event: "configuration",
    language,
    apiKeyPresent: hasValue(rawApiKey),
    agentIdPresent: hasValue(rawAgentId),
    apiKeyConfigured: apiKey !== null,
    agentIdConfigured: agentId !== null,
  });

  if (!apiKey || !agentId) {
    logVoiceSession("warn", { event: "configuration_missing", language });
    return errorResponse("Voice is not configured yet. You can continue by typing.", 503);
  }

  try {
    const url = new URL(PROVIDER_URL);
    url.searchParams.set("agent_id", agentId);
    const upstream = await fetch(url, {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const parsed = await parseJson(upstream);

    if (!upstream.ok) {
      logVoiceSession("warn", {
        event: "upstream_rejected",
        language,
        upstreamStatus: upstream.status,
        upstreamErrorCode: upstreamErrorCodeFrom(parsed.value),
        signedUrlExtracted: false,
      });
      return errorResponse(CLIENT_ERROR, 502);
    }

    const signedUrl = parsed.ok ? signedUrlFrom(parsed.value) : null;
    if (!signedUrl) {
      logVoiceSession("warn", {
        event: "invalid_response",
        language,
        upstreamStatus: upstream.status,
        responseWasJson: parsed.ok,
        signedUrlExtracted: false,
      });
      return errorResponse(CLIENT_ERROR, 502);
    }

    logVoiceSession("info", {
      event: "signed_url_ready",
      language,
      upstreamStatus: upstream.status,
      signedUrlExtracted: true,
    });

    return NextResponse.json(
      { signedUrl, language },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    logVoiceSession("error", {
      event: "request_failed",
      language,
      failureKind: isTimeout(error) ? "timeout" : "network",
      signedUrlExtracted: false,
    });
    return errorResponse(CLIENT_ERROR, 502);
  }
}

function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function configuredValue(value: string | undefined): string | null {
  if (!hasValue(value)) return null;
  const trimmed = value.trim();
  return PLACEHOLDER_VALUES.has(trimmed.toLowerCase()) ? null : trimmed;
}

async function parseJson(response: Response): Promise<{ ok: true; value: unknown } | { ok: false; value: null }> {
  try {
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false, value: null };
  }
}

function upstreamErrorCodeFrom(value: unknown): string | null {
  const record = asRecord(value);
  const detail = asRecord(record?.detail);
  const candidates = [detail?.status, detail?.code, record?.status, record?.code, record?.type];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && /^[A-Za-z0-9_.-]{1,80}$/.test(candidate)) return candidate;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function isTimeout(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("name" in error)) return false;
  return error.name === "TimeoutError" || error.name === "AbortError";
}

type LogLevel = "info" | "warn" | "error";

function logVoiceSession(level: LogLevel, details: Record<string, unknown>): void {
  console[level]("[voice-session]", details);
}

function languageFrom(value: unknown): Language | null {
  if (typeof value !== "object" || value === null || !("language" in value)) return null;
  return value.language === "en" || value.language === "es" ? value.language : null;
}

function signedUrlFrom(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("signed_url" in value)) return null;
  const signedUrl = value.signed_url;
  return typeof signedUrl === "string" && signedUrl.startsWith("wss://") ? signedUrl : null;
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configuredOrigin = process.env.VOICEMATCH_APP_ORIGIN;
  if (configuredOrigin) return origin === configuredOrigin;
  return origin === request.nextUrl.origin;
}

function clientAddress(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function consumeRateLimit(address: string): number | null {
  const now = Date.now();
  const current = requests.get(address);
  if (!current || now >= current.resetsAt) {
    requests.set(address, { count: 1, resetsAt: now + WINDOW_MS });
    return null;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return Math.ceil((current.resetsAt - now) / 1_000);
  current.count += 1;
  return null;
}

function noStoreHeaders(): HeadersInit {
  return {
    "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
    Pragma: "no-cache",
  };
}

function errorResponse(message: string, status: number, retryAfter?: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { ...noStoreHeaders(), ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
    },
  );
}
