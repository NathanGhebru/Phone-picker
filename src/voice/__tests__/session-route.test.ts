import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../../app/api/voice/session/route";

const API_KEY = "test-private-api-key";
const EN_AGENT_ID = "agent_test_english";
const ES_AGENT_ID = "agent_test_spanish";
let requestNumber = 0;

function request(language: "en" | "es"): NextRequest {
  requestNumber += 1;
  return new NextRequest("http://localhost/api/voice/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-forwarded-for": `test-${requestNumber}`,
    },
    body: JSON.stringify({ language }),
  });
}

async function withVoiceEnvironment(run: () => Promise<void>): Promise<void> {
  const previous = {
    apiKey: process.env.ELEVENLABS_API_KEY,
    english: process.env.ELEVENLABS_VOICE_AGENT_ID_EN,
    spanish: process.env.ELEVENLABS_VOICE_AGENT_ID_ES,
  };
  const originalFetch = globalThis.fetch;
  process.env.ELEVENLABS_API_KEY = API_KEY;
  process.env.ELEVENLABS_VOICE_AGENT_ID_EN = EN_AGENT_ID;
  process.env.ELEVENLABS_VOICE_AGENT_ID_ES = ES_AGENT_ID;
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment("ELEVENLABS_API_KEY", previous.apiKey);
    restoreEnvironment("ELEVENLABS_VOICE_AGENT_ID_EN", previous.english);
    restoreEnvironment("ELEVENLABS_VOICE_AGENT_ID_ES", previous.spanish);
  }
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function captureLogs(): { output: () => string; restore: () => void } {
  const entries: unknown[][] = [];
  const originals = { info: console.info, warn: console.warn, error: console.error };
  console.info = (...args: unknown[]) => { entries.push(args); };
  console.warn = (...args: unknown[]) => { entries.push(args); };
  console.error = (...args: unknown[]) => { entries.push(args); };
  return {
    output: () => JSON.stringify(entries),
    restore: () => {
      console.info = originals.info;
      console.warn = originals.warn;
      console.error = originals.error;
    },
  };
}

test("generates signed URLs with the selected English and Spanish agent IDs", async () => {
  await withVoiceEnvironment(async () => {
    const requestedAgentIds: string[] = [];
    const logs = captureLogs();
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      requestedAgentIds.push(url.searchParams.get("agent_id") ?? "");
      assert.equal(init?.method, undefined);
      assert.equal(new Headers(init?.headers).get("xi-api-key"), API_KEY);
      return Response.json({ signed_url: "wss://example.test/session?token=private-token" });
    };

    try {
      const english = await POST(request("en"));
      const spanish = await POST(request("es"));
      assert.equal(english.status, 200);
      assert.equal(spanish.status, 200);
      assert.deepEqual(requestedAgentIds, [EN_AGENT_ID, ES_AGENT_ID]);
      assert.deepEqual(await english.json(), {
        signedUrl: "wss://example.test/session?token=private-token",
        language: "en",
      });
      assert.equal(english.headers.get("cache-control"), "no-store, no-cache, max-age=0, must-revalidate");
      const logOutput = logs.output();
      assert.doesNotMatch(logOutput, new RegExp(API_KEY));
      assert.doesNotMatch(logOutput, /private-token/);
      assert.doesNotMatch(logOutput, new RegExp(EN_AGENT_ID));
      assert.doesNotMatch(logOutput, new RegExp(ES_AGENT_ID));
      assert.match(logOutput, /signed_url_ready/);
      assert.match(logOutput, /signedUrlExtracted.*true/);
    } finally {
      logs.restore();
    }
  });
});

test("returns 503 without calling ElevenLabs when configuration is missing or placeholder-only", async () => {
  await withVoiceEnvironment(async () => {
    delete process.env.ELEVENLABS_API_KEY;
    process.env.ELEVENLABS_VOICE_AGENT_ID_EN = "your_english_agent_id";
    let fetchCalls = 0;
    globalThis.fetch = async () => {
      fetchCalls += 1;
      return Response.json({ signed_url: "wss://should-not-be-used.test" });
    };

    const response = await POST(request("en"));
    assert.equal(response.status, 503);
    assert.equal(fetchCalls, 0);
    assert.deepEqual(await response.json(), {
      error: "Voice is not configured yet. You can continue by typing.",
    });
  });
});

test("logs a sanitized authentication code while keeping the client response generic", async () => {
  await withVoiceEnvironment(async () => {
    const logs = captureLogs();
    globalThis.fetch = async () => Response.json(
      { detail: { status: "missing_permissions", message: "sensitive provider explanation" } },
      { status: 401 },
    );

    try {
      const response = await POST(request("en"));
      assert.equal(response.status, 502);
      assert.deepEqual(await response.json(), {
        error: "Voice service is unavailable. Please try again or continue by typing.",
      });
      const logOutput = logs.output();
      assert.match(logOutput, /upstream_rejected/);
      assert.match(logOutput, /missing_permissions/);
      assert.match(logOutput, /401/);
      assert.doesNotMatch(logOutput, /sensitive provider explanation/);
      assert.doesNotMatch(logOutput, new RegExp(API_KEY));
    } finally {
      logs.restore();
    }
  });
});

test("handles upstream HTTP failures and invalid successful responses", async (context) => {
  await context.test("upstream HTTP error", async () => {
    await withVoiceEnvironment(async () => {
      globalThis.fetch = async () => Response.json(
        { detail: { status: "provider_unavailable" } },
        { status: 503 },
      );
      assert.equal((await POST(request("en"))).status, 502);
    });
  });

  await context.test("missing signed_url", async () => {
    await withVoiceEnvironment(async () => {
      globalThis.fetch = async () => Response.json({ signed_url: "https://not-a-websocket.test" });
      assert.equal((await POST(request("es"))).status, 502);
    });
  });

  await context.test("non-JSON success", async () => {
    await withVoiceEnvironment(async () => {
      globalThis.fetch = async () => new Response("not json", { status: 200 });
      assert.equal((await POST(request("en"))).status, 502);
    });
  });
});

test("distinguishes network failures from timeouts without logging exception messages", async (context) => {
  await context.test("network exception", async () => {
    await withVoiceEnvironment(async () => {
      const logs = captureLogs();
      globalThis.fetch = async () => { throw new Error("sensitive network details"); };
      try {
        assert.equal((await POST(request("en"))).status, 502);
        assert.match(logs.output(), /network/);
        assert.doesNotMatch(logs.output(), /sensitive network details/);
      } finally {
        logs.restore();
      }
    });
  });

  await context.test("timeout exception", async () => {
    await withVoiceEnvironment(async () => {
      const logs = captureLogs();
      globalThis.fetch = async () => { throw new DOMException("sensitive timeout details", "TimeoutError"); };
      try {
        assert.equal((await POST(request("es"))).status, 502);
        assert.match(logs.output(), /timeout/);
        assert.doesNotMatch(logs.output(), /sensitive timeout details/);
      } finally {
        logs.restore();
      }
    });
  });
});
