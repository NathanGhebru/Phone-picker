import { NextRequest, NextResponse } from "next/server";
import type { Language } from "@/shared/types";

const PROVIDER_URL = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const requests = new Map<string, { count: number; resetsAt: number }>();

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return errorResponse("Voice session requests must come from this site.", 403);

  const rateLimit = consumeRateLimit(clientAddress(request));
  if (rateLimit) return errorResponse("Please wait before starting another voice session.", 429, rateLimit);

  const body: unknown = await request.json().catch(() => null);
  const language = languageFrom(body);
  if (!language) return errorResponse("Choose English or Spanish before starting voice.", 400);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = language === "en" ? process.env.ELEVENLABS_VOICE_AGENT_ID_EN : process.env.ELEVENLABS_VOICE_AGENT_ID_ES;
  if (!apiKey || !agentId) return errorResponse("Voice is not configured yet. You can continue by typing.", 503);

  try {
    const url = new URL(PROVIDER_URL);
    url.searchParams.set("agent_id", agentId);
    const upstream = await fetch(url, {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) return errorResponse("Voice service is unavailable. Please try again or continue by typing.", 502);

    const payload: unknown = await upstream.json();
    const signedUrl = signedUrlFrom(payload);
    if (!signedUrl) return errorResponse("Voice service is unavailable. Please try again or continue by typing.", 502);

    return NextResponse.json(
      { signedUrl, language },
      { headers: noStoreHeaders() },
    );
  } catch {
    return errorResponse("Voice service is unavailable. Please try again or continue by typing.", 502);
  }
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
