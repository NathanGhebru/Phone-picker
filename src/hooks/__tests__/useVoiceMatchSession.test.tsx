import assert from "node:assert/strict";
import { after, before, test, type TestContext } from "node:test";
import { JSDOM } from "jsdom";
import { act, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { ConversationEngine } from "../../agent/conversation-engine";
import { RecommendationClient } from "../../agent/recommendation-client";
import type { ProcessTurnParams } from "../../agent/types";
import { POST as recommend } from "../../app/api/recommendations/route";
import { RecommendationResults } from "../../components/RecommendationResults";
import type { Language, Preferences, RecommendationResponse } from "../../shared/types";
import { createElevenLabsVoiceAdapter, type ElevenLabsStartSessionOptions } from "../../voice/elevenlabs-adapter";
import { VoiceSessionController } from "../../voice/session-controller";
import phones from "../../data/phones.json";
import plans from "../../data/plans.json";
import { useVoiceMatchSession } from "../useVoiceMatchSession";

// These integration tests run the actual hook, transport, conversation engine,
// recommendation route, catalog, and cards. Only the SDK/audio/network boundary
// is simulated: they do not establish a live ElevenLabs or microphone session.
const ENGLISH = "One line, $60 including the phone. I need large readable text and a simple phone for YouTube.";
const SPANISH = "Una línea, 60 dólares incluyendo el teléfono. Necesito letras grandes y un teléfono sencillo para YouTube.";
const browser = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost:3000" });
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();

before(() => {
  for (const [name, value] of Object.entries({
    window: browser.window,
    document: browser.window.document,
    navigator: browser.window.navigator,
    HTMLElement: browser.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
});

after(() => {
  browser.window.close();
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

type HarnessOptions = {
  language?: Language;
  beforeFetch?: (index: number) => Promise<void>;
  failFetch?: () => boolean;
  failTurn?: () => boolean;
};

async function mount(t: TestContext, options: HarnessOptions = {}) {
  const sdkCalls: ElevenLabsStartSessionOptions[] = [];
  const authorizations: Language[] = [];
  const engineCalls: ProcessTurnParams[] = [];
  const requests: Array<{ url: string; method: string; preferences: Preferences }> = [];
  const responses: RecommendationResponse[] = [];
  let ended = 0;
  let permissionRequests = 0;
  let mounted = true;
  let latest: ReturnType<typeof useVoiceMatchSession> | undefined;
  const controller = new VoiceSessionController(createElevenLabsVoiceAdapter({
    async startSession(startOptions) {
      sdkCalls.push(startOptions);
      startOptions.onStatusChange({ status: "connecting" });
      startOptions.onConnect();
      return { async endSession() { ended += 1; startOptions.onDisconnect(); } };
    },
  }, {
    async createSession(language) {
      authorizations.push(language);
      return { signedUrl: "wss://example.test/simulated-authorized-session" };
    },
  }), async () => { permissionRequests += 1; });
  const engine = new ConversationEngine(new RecommendationClient({
    enableLocalFallback: false,
    fetchFn: async (input, init) => {
      const request = new Request(new URL(String(input), "http://localhost:3000"), init);
      const body = await request.clone().json() as { preferences: Preferences };
      requests.push({ url: request.url, method: request.method, preferences: body.preferences });
      await options.beforeFetch?.(requests.length);
      if (options.failFetch?.()) return Response.json({ error: "Recommendations are temporarily unavailable." }, { status: 503 });
      const response = await recommend(request);
      assert.equal(response.status, 200, "real recommendation route accepts the engine's preference contract");
      responses.push(await response.clone().json() as RecommendationResponse);
      return response;
    },
  }));
  const dependencies = {
    createVoiceController: async () => controller,
    processTurn: async (params: ProcessTurnParams) => {
      engineCalls.push(structuredClone(params));
      if (options.failTurn?.()) throw new Error("Private implementation details must not be spoken");
      return engine.processTurn(params);
    },
  };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  function Harness() {
    const session = useVoiceMatchSession(options.language ?? "en", dependencies);
    useLayoutEffect(() => { latest = session; });
    return <RecommendationResults data={session.recommendations} isLoading={session.isSubmitting} error={session.error} language={session.language} selectedId={session.selectedRecommendationId} />;
  }
  await act(async () => { root.render(<Harness />); });
  const unmount = async () => {
    if (!mounted) return;
    mounted = false;
    await act(async () => { root.unmount(); });
    container.remove();
  };
  t.after(unmount);
  return {
    container, sdkCalls, authorizations, engineCalls, requests, responses,
    get session() { assert.ok(latest); return latest; },
    get endCount() { return ended; },
    get permissionCount() { return permissionRequests; },
    get sdk() { const sdk = sdkCalls.at(-1); assert.ok(sdk); return sdk; },
    get tool() { const tool = sdkCalls.at(-1)?.clientTools?.process_voice_turn; assert.ok(tool); return tool; },
    async start() { await act(async () => { await this.session.startVoice(); }); },
    async invoke(parameters: Record<string, unknown>) {
      let response: string | number | void;
      await act(async () => { response = await this.tool(parameters); });
      assert.equal(typeof response!, "string");
      return response! as string;
    },
    unmount,
  };
}

for (const language of ["en", "es"] as const) {
  test(`${language}: SDK tool runs once through real recommendations, renders cards, and returns grounded speech`, async (t) => {
    const app = await mount(t, { language });
    await app.start();
    assert.deepEqual(app.authorizations, [language]);
    assert.equal(app.permissionCount, 1);
    assert.equal(app.sdk.overrides.agent.language, language);
    assert.deepEqual(Object.keys(app.sdk.clientTools ?? {}), ["process_voice_turn"]);
    assert.equal(app.session.voiceState, "listening");
    const utterance = language === "en" ? ENGLISH : SPANISH;
    await act(async () => {
      app.sdk.onMessage({ source: "user", role: "user", message: utterance, event_id: 7 });
      app.sdk.onMessage({ source: "user", role: "user", message: utterance, event_id: 7 });
    });
    assert.equal(app.engineCalls.length, 0, "confirmed transcript observations do not execute application actions");
    const speech = await app.invoke({ text: utterance });
    assert.equal(app.engineCalls.length, 1);
    assert.equal(app.engineCalls[0].source, "voice");
    assert.equal(app.requests.length, 1);
    assert.equal(app.requests[0].url, "http://localhost:3000/api/recommendations");
    assert.equal(app.requests[0].method, "POST");
    assert.deepEqual(app.requests[0].preferences, app.session.preferences);
    assert.equal(app.session.preferences.language, language);
    assert.equal(app.session.preferences.lines, 1);
    assert.equal(app.session.preferences.budgetMonthlyTotal, 60);
    assert.equal(app.session.preferences.budgetIncludesDevice, true);
    assert.equal(app.session.preferences.priorities.displayReadability, 5);
    assert.ok(app.session.preferences.accessibilityNeeds.includes("readable_text"));
    assert.ok(app.session.preferences.usage.includes("youtube"));
    assert.equal(app.session.preferences.eligibility.age55Plus, "unknown");
    assert.deepEqual(app.session.recommendations, app.responses[0]);
    const ranked = app.responses[0].recommendations;
    assert.ok(ranked.length > 0);
    assert.equal(app.container.querySelectorAll("article").length, ranked.length);
    for (const recommendation of ranked) {
      assert.ok(app.container.textContent?.includes(recommendation.phoneId));
      assert.ok(app.container.textContent?.includes(recommendation.planId));
      assert.ok(recommendation.sourceUrls.length > 0);
      assert.ok(recommendation.estimatedMonthlyTotal !== null && recommendation.estimatedMonthlyTotal <= 60);
    }
    const topPhone = phones.find((p) => p.id === ranked[0].phoneId)?.name ?? ranked[0].phoneId;
    const topPlan = plans.find((p) => p.id === ranked[0].planId)?.name ?? ranked[0].planId;
    assert.ok(speech.includes(topPhone) || speech.includes(ranked[0].phoneId));
    assert.ok(speech.includes(topPlan) || speech.includes(ranked[0].planId));
    assert.ok(speech.includes(String(ranked[0].estimatedMonthlyTotal)));
    assert.match(speech, language === "es" ? /encontrado|recomendad|coincidencia/i : /found|recommend|match/i);
    assert.equal(app.session.selectedRecommendationId, ranked[0].id);
    assert.equal(app.session.conversationState.turnCount, 1);
    assert.equal(app.session.transcript.filter((entry) => entry.speaker === "user" && entry.text === utterance).length, 1);
    // Voice assistant text belongs to the provider's spoken transcript. The
    // engine returns it to the blocking tool, without also appending an echo.
    assert.equal(app.session.transcript.filter((entry) => entry.speaker === "assistant").length, 0);
    await act(async () => {
      app.sdk.onMessage({ source: "ai", role: "agent", message: speech });
      app.sdk.onModeChange({ mode: "speaking" });
      app.sdk.onModeChange({ mode: "listening" });
      app.sdk.onStatusChange({ status: "connected" });
    });
    assert.equal(app.engineCalls.length, 1, "speech and interruption callbacks never duplicate the tool action");
    assert.equal(app.session.transcript.filter((entry) => entry.speaker === "assistant").length, 1);
  });
}

test("typed preferences and spoken correction share the same conversation and selected recommendation", async (t) => {
  const app = await mount(t);
  await act(async () => { await app.session.submitMessage(ENGLISH); });
  const previous = app.session.preferences;
  await app.start();
  await app.invoke({ text: "Actually, make that $40." });
  assert.deepEqual(app.engineCalls.map((call) => call.source), ["text", "voice"]);
  assert.deepEqual(app.engineCalls[1].preferences, previous);
  assert.equal(app.engineCalls[1].conversationState?.turnCount, 1);
  assert.equal(app.session.preferences.budgetMonthlyTotal, 40);
  assert.equal(app.session.preferences.lines, 1);
  assert.equal(app.session.preferences.priorities.displayReadability, 5);
  assert.equal(app.session.conversationState.turnCount, 2);
  assert.deepEqual(app.requests.map((request) => request.preferences.budgetMonthlyTotal), [60, 40]);
});

test("malformed tool inputs cannot execute the engine or create recommendations", async (t) => {
  const app = await mount(t);
  await app.start();
  for (const parameters of [{}, { text: "" }, { text: " \n " }, { text: 40 }, { text: ENGLISH, budget: 1 }, { text: "x".repeat(4001) }]) {
    const response = await app.invoke(parameters);
    assert.ok(response.length > 0, "invalid arguments receive a safe reply");
    assert.doesNotMatch(response, /best match|found \d|recomendadas/i);
  }
  assert.equal(app.engineCalls.length, 0);
  assert.equal(app.requests.length, 0);
  assert.equal(app.session.recommendations, null);
});

test("overlapping spoken turns process FIFO without losing a budget correction", async (t) => {
  const gate = deferred();
  const entered = deferred();
  const app = await mount(t, { beforeFetch: async (index) => { if (index === 1) { entered.resolve(); await gate.promise; } } });
  await app.start();
  let first!: ReturnType<typeof app.tool>;
  let second!: ReturnType<typeof app.tool>;
  await act(async () => {
    first = app.tool({ text: ENGLISH });
    await entered.promise;
    second = app.tool({ text: "Actually, make that $40." });
  });
  assert.equal(app.engineCalls.length, 1);
  assert.equal(app.session.isSubmitting, true);
  await act(async () => { gate.resolve(); await Promise.all([first, second]); });
  assert.equal(app.engineCalls.length, 2);
  assert.equal(app.engineCalls[1].preferences.budgetMonthlyTotal, 60);
  assert.equal(app.engineCalls[1].conversationState?.turnCount, 1);
  assert.equal(app.session.preferences.budgetMonthlyTotal, 40);
  assert.equal(app.session.conversationState.turnCount, 2);
  assert.equal(app.session.isSubmitting, false);
});

for (const action of ["stop", "disconnect", "language switch", "unmount"] as const) {
  test(`${action} invalidates pending results and stale tool handlers`, async (t) => {
    const gate = deferred();
    const entered = deferred();
    const app = await mount(t, { beforeFetch: async () => { entered.resolve(); await gate.promise; } });
    await app.start();
    const staleTool = app.tool;
    let pending!: ReturnType<typeof staleTool>;
    await act(async () => { pending = staleTool({ text: ENGLISH }); await entered.promise; });
    const stateBeforeCancellation = app.session;
    if (action === "unmount") await app.unmount();
    else await act(async () => {
      if (action === "stop") await app.session.stopVoice();
      else if (action === "disconnect") app.sdk.onDisconnect();
      else app.session.setLanguage("es");
    });
    let cancelledResponse: unknown;
    await act(async () => { gate.resolve(); cancelledResponse = await pending; });
    assert.equal(typeof cancelledResponse, "string");
    assert.equal(app.session.recommendations, null);
    assert.equal(app.session.preferences.budgetMonthlyTotal, null);
    assert.equal(app.session.conversationState.turnCount, 0);
    if (action === "unmount") assert.strictEqual(app.session, stateBeforeCancellation);
    else assert.equal(app.session.isSubmitting, false);
    const callsBeforeStaleInvocation = app.engineCalls.length;
    await act(async () => { await staleTool({ text: "Actually, make that $500." }); });
    assert.equal(app.engineCalls.length, callsBeforeStaleInvocation);
    if (action === "stop" || action === "unmount") assert.equal(app.endCount, 1);
    if (action === "language switch") {
      assert.equal(app.session.language, "es");
      await app.start();
      assert.deepEqual(app.authorizations, ["en", "es"]);
      assert.equal(app.sdk.overrides.agent.language, "es");
      await app.invoke({ text: SPANISH });
      assert.equal(app.session.preferences.language, "es");
      assert.equal(app.session.preferences.budgetMonthlyTotal, 60);
    }
  });
}

test("unconfirmed provider messages and interruptions remain observational", async (t) => {
  const app = await mount(t);
  await app.start();
  await act(async () => {
    app.sdk.onMessage({ source: "user", role: "user", message: "Maybe $500", event_id: 9, isFinal: false });
    app.sdk.onModeChange({ mode: "speaking" });
    app.sdk.onModeChange({ mode: "listening" });
  });
  assert.equal(app.session.transcript[0].final, false);
  assert.equal(app.session.preferences.budgetMonthlyTotal, null);
  assert.equal(app.session.voiceState, "listening");
  assert.equal(app.engineCalls.length, 0);
});

test("unknown budget scope asks a follow-up before claiming a bundle fits", async (t) => {
  const app = await mount(t);
  await app.start();
  const reply = await app.invoke({ text: "One line, $60 a month." });
  assert.equal(app.session.preferences.budgetIncludesDevice, null);
  assert.equal(app.requests.length, 0);
  assert.match(reply, /include.*phone.*plan/i);
  await app.invoke({ text: "Yes, just the plan." });
  assert.equal(app.session.preferences.budgetIncludesDevice, false);
  assert.equal(app.requests.length, 1);
  assert.equal(app.requests[0].preferences.budgetIncludesDevice, false);
});

test("unsupported budget produces honest empty results without invented phones", async (t) => {
  const app = await mount(t);
  await app.start();
  const reply = await app.invoke({ text: "One line, $1 including the phone." });
  assert.equal(app.requests.length, 1);
  assert.deepEqual(app.session.recommendations, app.responses[0]);
  assert.equal(app.session.recommendations?.recommendations.length, 0);
  assert.equal(app.container.querySelectorAll("article").length, 0);
  assert.match(reply, /no .*budget|no .*match|no .*meet|no .*verified/i);
  assert.doesNotMatch(reply, /best match is|I found \d/i);
});

test("backend failure returns an honest tool error and a later turn can recover", async (t) => {
  let failing = true;
  const app = await mount(t, { failFetch: () => failing });
  await app.start();
  const reply = await app.invoke({ text: ENGLISH });
  assert.match(reply, /issue retrieving|unable|unavailable|could not/i);
  assert.equal(app.session.recommendations, null);
  assert.ok(app.session.error);
  assert.equal(app.container.querySelectorAll("article").length, 0);
  failing = false;
  await app.invoke({ text: "Actually, make that $80." });
  assert.equal(app.session.error, null);
  const recsAfterRecovery = app.session.recommendations as RecommendationResponse | null;
  assert.ok(recsAfterRecovery?.recommendations.length);
  assert.equal(app.session.isSubmitting, false);
});

test("unexpected tool failures return localized safe speech without exception details", async (t) => {
  let failing = true;
  const app = await mount(t, { language: "es", failTurn: () => failing });
  await app.start();
  const reply = await app.invoke({ text: SPANISH });
  assert.ok(reply.length > 0);
  assert.doesNotMatch(reply, /Private implementation|best match|I found/);
  assert.equal(app.session.recommendations, null);
  assert.equal(app.session.isSubmitting, false);
  failing = false;
  await app.invoke({ text: SPANISH });
  const finalRecs = app.session.recommendations as RecommendationResponse | null;
  assert.ok(finalRecs?.recommendations.length);
});
