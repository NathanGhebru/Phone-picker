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
  assert.equal("clientTools" in sessionOptions, false);
  assert.equal("apiKey" in sessionOptions, false);
});

test("forwards one asynchronous client tool unchanged without lifecycle invocation", async () => {
  const calls: ElevenLabsStartSessionOptions[] = [];
  let toolInvocations = 0;
  const clientTools = {
    process_voice_turn: async (parameters: Record<string, unknown>) => {
      toolInvocations += 1;
      assert.deepEqual(parameters, { text: "I need a simple phone" });
      return "Here is a grounded response.";
    },
  };
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
    language: "en",
    clientTools,
    onConnected() {},
    onDisconnected() {},
    onConnectionState() {},
    onMode() {},
    onMessage() {},
    onError() {},
  });

  const sessionOptions = calls[0];
  assert.ok(sessionOptions?.clientTools);
  assert.strictEqual(sessionOptions.clientTools, clientTools);
  sessionOptions.onConnect();
  sessionOptions.onModeChange({ mode: "listening" });
  sessionOptions.onStatusChange({ status: "connected" });
  assert.equal(toolInvocations, 0);
  assert.equal(await sessionOptions.clientTools.process_voice_turn({ text: "I need a simple phone" }), "Here is a grounded response.");
  assert.equal(toolInvocations, 1);
});

test("unwraps the SDK status callback object and ignores disconnecting", async () => {
  const calls: ElevenLabsStartSessionOptions[] = [];
  const states: string[] = [];
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
    language: "en",
    onConnected() {},
    onDisconnected() {},
    onConnectionState: (state) => states.push(state),
    onMode() {},
    onMessage() {},
    onError() {},
  });

  const sessionOptions = calls[0];
  assert.ok(sessionOptions);
  sessionOptions.onStatusChange({ status: "connecting" });
  sessionOptions.onStatusChange({ status: "connected" });
  sessionOptions.onStatusChange({ status: "disconnecting" });
  sessionOptions.onStatusChange({ status: "disconnected" });
  assert.deepEqual(states, ["connecting", "connected", "disconnected"]);
});
