import assert from "node:assert/strict";
import test from "node:test";
import {
  createElevenLabsVoiceAdapter,
  createHttpSessionAuthorizer,
  type ElevenLabsStartSessionOptions,
} from "../elevenlabs-adapter";

test("does not start the provider when server session authorization fails", async () => {
  const authorizer = createHttpSessionAuthorizer(async () => new Response("unavailable", { status: 503 }));
  await assert.rejects(() => authorizer.createSession("en"), /authorization failed/i);
});

test("uses a server-issued signed URL and explicit selected language", async () => {
  const calls: ElevenLabsStartSessionOptions[] = [];
  const adapter = createElevenLabsVoiceAdapter(
    {
      async startSession(options) {
        calls.push(options);
        return { async endSession() {} };
      },
    },
    { async createSession() { return { signedUrl: "wss://example.test/session" }; } },
  );

  await adapter.start({
    language: "es",
    onConnected() {},
    onDisconnected() {},
    onConnectionState() {},
    onMode() {},
    onMessage() {},
    onError() {},
  });

  const sessionOptions = calls[0];
  assert.ok(sessionOptions);
  assert.equal(sessionOptions.signedUrl, "wss://example.test/session");
  assert.equal(sessionOptions.connectionType, "websocket");
  assert.equal(sessionOptions.overrides.agent.language, "es");
  assert.equal("apiKey" in sessionOptions, false);
});
