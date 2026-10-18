import assert from "node:assert";
import { describe, it } from "node:test";
import { ConversationEngine, processTurn } from "../conversation-engine";
import {
  explainCheaperAlternative,
  explainRecommendation,
  translateReasonCode,
} from "../explanations";
import {
  MOCK_FIXTURE_EN_RECOMMENDATIONS,
  MOCK_FIXTURE_NO_MATCH_RESPONSE,
} from "../fixtures";
import {
  validateStructuredLLMOutput,
} from "../preference-extractor";
import {
  createInitialPreferences,
  createPreferenceUpdate,
  mergePreferences,
  validatePreferencePatch,
  validatePreferences,
} from "../preference-state";
import {
  RecommendationClient,
} from "../recommendation-client";
import type { Preferences } from "../../shared/types";

describe("VoiceMatch Agent - 16 Acceptance Criteria", () => {
  // Criterion 1: English input produces valid Preferences updates
  it("Criterion 1: English input produces valid Preferences updates", async () => {
    const initial = createInitialPreferences("en");
    const utterance =
      "My mom mainly uses YouTube and needs large readable text. We have one line, and the budget is $60 including the phone.";
    const result = await processTurn({
      text: utterance,
      source: "text",
      language: "en",
      preferences: initial,
    });

    assert.ok(result.preferenceUpdate !== null, "Expected preferenceUpdate to be present");
    assert.strictEqual(result.preferences.lines, 1);
    assert.strictEqual(result.preferences.budgetMonthlyTotal, 60);
    assert.strictEqual(result.preferences.budgetIncludesDevice, true);
    assert.strictEqual(result.preferences.priorities.displayReadability, 5);
    assert.ok(result.preferences.usage.includes("youtube"));
    assert.ok(result.preferences.accessibilityNeeds.includes("readable_text"));

    const validation = validatePreferences(result.preferences);
    assert.strictEqual(validation.valid, true, `Preferences must be valid: ${validation.errors.join(", ")}`);
  });

  // Criterion 2: Spanish input produces equivalent canonical preferences
  it("Criterion 2: Spanish input produces equivalent canonical preferences", async () => {
    const initial = createInitialPreferences("es");
    const utterance =
      "Mi mamá necesita un teléfono para ver YouTube y leer letras grandes. Una línea, 60 dólares incluyendo el teléfono.";
    const result = await processTurn({
      text: utterance,
      source: "text",
      language: "es",
      preferences: initial,
    });

    assert.strictEqual(result.preferences.lines, 1);
    assert.strictEqual(result.preferences.budgetMonthlyTotal, 60);
    assert.strictEqual(result.preferences.budgetIncludesDevice, true);
    assert.strictEqual(result.preferences.priorities.displayReadability, 5);
    assert.ok(result.preferences.usage.includes("youtube"));
    assert.ok(result.preferences.accessibilityNeeds.includes("readable_text"));

    const validation = validatePreferences(result.preferences);
    assert.strictEqual(validation.valid, true);
  });

  // Criterion 3: Unknown budget scope remains null
  it("Criterion 3: Unknown budget scope remains null", async () => {
    const initial = createInitialPreferences("en");
    const utterance = "I need one line, budget is $50 a month.";
    const result = await processTurn({
      text: utterance,
      source: "text",
      preferences: initial,
    });

    assert.strictEqual(result.preferences.budgetMonthlyTotal, 50);
    assert.strictEqual(result.preferences.budgetIncludesDevice, null);
    // Assistant policy should ask to clarify whether budget includes the phone
    assert.ok(
      result.assistantText.includes("include both") || result.assistantText.includes("device"),
      "Assistant should ask to clarify budget scope"
    );
  });

  // Criterion 4: Explicit corrections override previous values
  it("Criterion 4: Explicit corrections override previous values", async () => {
    const initial = createInitialPreferences("en");
    const turn1 = await processTurn({
      text: "One line, $60 including the phone. She needs large text.",
      source: "text",
      preferences: initial,
    });
    assert.strictEqual(turn1.preferences.budgetMonthlyTotal, 60);
    assert.strictEqual(turn1.preferences.lines, 1);

    const turn2 = await processTurn({
      text: "Actually, make that $40.",
      source: "text",
      preferences: turn1.preferences,
      conversationState: turn1.conversationState,
      recommendations: turn1.recommendations,
    });

    // Budget overridden, but lines and priorities preserved!
    assert.strictEqual(turn2.preferences.budgetMonthlyTotal, 40);
    assert.strictEqual(turn2.preferences.lines, 1);
    assert.strictEqual(turn2.preferences.priorities.displayReadability, 5);
  });

  // Criterion 5: Nested priority updates preserve sibling values
  it("Criterion 5: Nested priority updates preserve sibling values", () => {
    const current = createInitialPreferences("en");
    current.priorities.displayReadability = 5;
    current.priorities.battery = 4;

    const update = createPreferenceUpdate(
      { priorities: { camera: 5 } as Preferences["priorities"] },
      "text",
      "need great camera"
    );

    const merged = mergePreferences(current, update);
    assert.strictEqual(merged.priorities.camera, 5);
    assert.strictEqual(merged.priorities.displayReadability, 5, "Sibling displayReadability must be preserved");
    assert.strictEqual(merged.priorities.battery, 4, "Sibling battery must be preserved");
  });

  // Criterion 6: Typed and confirmed-voice inputs use the same processing path
  it("Criterion 6: Typed and confirmed-voice inputs use the same processing path", async () => {
    const initialVoice = createInitialPreferences("en");
    const initialText = createInitialPreferences("en");
    const utterance = "One line, $60 including the device. Large text readability.";

    const voiceResult = await processTurn({
      text: utterance,
      source: "voice",
      preferences: initialVoice,
      isFinal: true,
    });

    const textResult = await processTurn({
      text: utterance,
      source: "text",
      preferences: initialText,
      isFinal: true,
    });

    assert.deepStrictEqual(voiceResult.preferences, textResult.preferences);
    assert.strictEqual(voiceResult.assistantText, textResult.assistantText);
    assert.strictEqual(voiceResult.selectedRecommendationId, textResult.selectedRecommendationId);
  });

  // Criterion 7: No update occurs from unconfirmed text
  it("Criterion 7: No update occurs from unconfirmed text", async () => {
    const initial = createInitialPreferences("en");
    const utterance = "One line, $60 including the device.";

    const result = await processTurn({
      text: utterance,
      source: "voice",
      preferences: initial,
      isFinal: false, // unconfirmed hypothesis
    });

    assert.strictEqual(result.preferenceUpdate, null);
    assert.deepStrictEqual(result.preferences, initial);
    assert.strictEqual(result.events.length, 0);
  });

  // Criterion 8: Recommendation API is called with the exact existing request contract
  it("Criterion 8: Recommendation API is called with the exact existing request contract", async () => {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody = "";

    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      capturedBody = String(init?.body);
      return new Response(JSON.stringify(MOCK_FIXTURE_EN_RECOMMENDATIONS), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = new RecommendationClient({
      baseUrl: "http://localhost:3000",
      fetchFn: mockFetch as unknown as typeof fetch,
      enableLocalFallback: false,
    });

    const prefs = createInitialPreferences("en");
    prefs.lines = 1;
    prefs.budgetMonthlyTotal = 60;
    prefs.budgetIncludesDevice = true;

    const response = await client.getRecommendations(prefs);

    assert.strictEqual(capturedUrl, "http://localhost:3000/api/recommendations");
    assert.strictEqual(capturedMethod, "POST");
    const parsedBody = JSON.parse(capturedBody);
    assert.ok(parsedBody.preferences, "Payload must have preferences key");
    assert.strictEqual(parsedBody.preferences.lines, 1);
    assert.strictEqual(parsedBody.preferences.budgetMonthlyTotal, 60);
    assert.strictEqual(response.recommendations.length, 3);
  });

  // Criterion 9: Empty recommendations return an honest explanation
  it("Criterion 9: Empty recommendations return an honest explanation", async () => {
    const mockFetch = async (): Promise<Response> => {
      return new Response(JSON.stringify(MOCK_FIXTURE_NO_MATCH_RESPONSE), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = new RecommendationClient({
      fetchFn: mockFetch as unknown as typeof fetch,
      enableLocalFallback: false,
    });
    const engine = new ConversationEngine(client);

    const initial = createInitialPreferences("en");
    const result = await engine.processTurn({
      text: "One line, $15 including the phone.",
      source: "text",
      preferences: initial,
    });

    assert.strictEqual(result.recommendations?.recommendations.length, 0);
    assert.ok(
      result.assistantText.includes("No combinations meet") ||
        result.assistantText.includes("budget"),
      "Assistant must explain honestly that no options met the budget"
    );
  });

  // Criterion 10: Unknown eligibility remains unknown
  it("Criterion 10: Unknown eligibility remains unknown", async () => {
    const initial = createInitialPreferences("en");
    const utterance = "I need a phone for my mom. She is 72 years old.";
    const result = await processTurn({
      text: utterance,
      source: "text",
      preferences: initial,
    });

    assert.strictEqual(
      result.preferences.eligibility.age55Plus,
      "unknown",
      "Parent age mention must not set account holder 55+ eligibility to yes"
    );
  });

  // Criterion 11: Cheaper-option intent behaves without inventing prices
  it("Criterion 11: Cheaper-option intent behaves without inventing prices", () => {
    // Case A: Strictly cheaper option exists
    const recs = MOCK_FIXTURE_EN_RECOMMENDATIONS.recommendations;
    const cheaperExists = explainCheaperAlternative(recs, "rec-1-best", "en");
    assert.strictEqual(cheaperExists.foundCheaper, true);
    assert.strictEqual(cheaperExists.cheaperRecommendation?.estimatedMonthlyTotal, 54);
    assert.ok(cheaperExists.text.includes("$54"), "Must quote exact returned price");

    // Case B: Already on lowest option or no cheaper option
    const alreadyLowest = explainCheaperAlternative(recs, "rec-2-lowest", "en");
    assert.strictEqual(alreadyLowest.foundCheaper, false);
    assert.ok(
      alreadyLowest.text.includes("lowest-cost") ||
        alreadyLowest.text.includes("most affordable"),
      "Must state that current options are already lowest-cost"
    );
  });

  // Criterion 12: Explanations use real recommendation reason codes
  it("Criterion 12: Explanations use real recommendation reason codes", () => {
    const rec = { ...MOCK_FIXTURE_EN_RECOMMENDATIONS.recommendations[0] };
    const explanation = explainRecommendation(rec, "en");
    assert.ok(
      explanation.includes("budget") || explanation.includes("display"),
      "Should explain grounded reasons"
    );

    // If an unknown reason code is provided, report it explicitly rather than hallucinating
    const unknownTranslation = translateReasonCode("mystery_promo_code", "en");
    assert.strictEqual(
      unknownTranslation,
      "Reason code 'mystery_promo_code' (definition pending catalog dictionary)"
    );
  });

  // Criterion 13: A jargon question preserves session context
  it("Criterion 13: A jargon question preserves session context", async () => {
    const prefs = createInitialPreferences("en");
    prefs.lines = 1;
    prefs.budgetMonthlyTotal = 60;
    prefs.budgetIncludesDevice = true;

    const result = await processTurn({
      text: "What is hotspot?",
      source: "text",
      preferences: prefs,
      recommendations: MOCK_FIXTURE_EN_RECOMMENDATIONS,
      selectedRecommendationId: "rec-1-best",
    });

    // Preferences and active recommendations preserved!
    assert.strictEqual(result.preferences.lines, 1);
    assert.strictEqual(result.preferences.budgetMonthlyTotal, 60);
    assert.strictEqual(result.recommendations, MOCK_FIXTURE_EN_RECOMMENDATIONS);
    assert.strictEqual(result.selectedRecommendationId, "rec-1-best");
    assert.ok(
      result.assistantText.includes("portable Wi-Fi") ||
        result.assistantText.includes("share its cellular internet"),
      "Must explain hotspot concept"
    );
  });

  // Criterion 14: Multiple turns preserve conversation state
  it("Criterion 14: Multiple turns preserve conversation state", async () => {
    let state = undefined;
    let prefs = createInitialPreferences("en");
    let recs = null;

    // Turn 1
    const t1 = await processTurn({
      text: "I need 1 line for YouTube and readable text.",
      source: "text",
      preferences: prefs,
      conversationState: state,
    });
    prefs = t1.preferences;
    state = t1.conversationState;
    assert.strictEqual(state.turnCount, 1);
    assert.strictEqual(prefs.lines, 1);

    // Turn 2
    const t2 = await processTurn({
      text: "My budget is $60 including the device.",
      source: "text",
      preferences: prefs,
      conversationState: state,
    });
    prefs = t2.preferences;
    state = t2.conversationState;
    recs = t2.recommendations;
    assert.strictEqual(state.turnCount, 2);
    assert.strictEqual(prefs.budgetMonthlyTotal, 60);
    assert.strictEqual(prefs.budgetIncludesDevice, true);

    // Turn 3: Terminology
    const t3 = await processTurn({
      text: "What is 5G?",
      source: "text",
      preferences: prefs,
      conversationState: state,
      recommendations: recs,
    });
    prefs = t3.preferences;
    state = t3.conversationState;
    assert.strictEqual(state.turnCount, 3);
    assert.strictEqual(prefs.lines, 1);
    assert.strictEqual(prefs.budgetMonthlyTotal, 60);

    // Turn 4: Correction
    const t4 = await processTurn({
      text: "Actually, make that $50.",
      source: "text",
      preferences: prefs,
      conversationState: state,
      recommendations: recs,
    });
    assert.strictEqual(t4.preferences.budgetMonthlyTotal, 50);
    assert.strictEqual(t4.preferences.lines, 1);
    assert.strictEqual(t4.conversationState.turnCount, 4);
    assert.strictEqual(t4.conversationState.history.length, 8); // 4 user turns + 4 assistant replies
  });

  // Criterion 15: API errors are handled safely
  it("Criterion 15: API errors are handled safely", async () => {
    const errorFetch = async (): Promise<Response> => {
      return new Response(JSON.stringify({ error: "Catalog database offline" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = new RecommendationClient({
      fetchFn: errorFetch as unknown as typeof fetch,
      enableLocalFallback: false,
    });
    const engine = new ConversationEngine(client);

    const initial = createInitialPreferences("en");
    const result = await engine.processTurn({
      text: "One line, $60 including the device.",
      source: "text",
      preferences: initial,
    });

    // Does not throw, returns friendly error explanation
    assert.ok(
      result.assistantText.includes("Catalog database offline") ||
        result.assistantText.includes("problem") ||
        result.assistantText.includes("issue"),
      "Assistant should explain the issue gracefully"
    );
  });

  // Criterion 16: No fabricated recommendation data or unapproved schema extensions
  it("Criterion 16: No fabricated recommendation data or unapproved schema extensions", () => {
    const invalidPatch: Record<string, unknown> = {
      lines: 2,
      fakeDiscountPromo: "50% off",
      carrierScore: 99,
    };

    const patchValidation = validatePreferencePatch(invalidPatch as Partial<Preferences>);
    assert.strictEqual(patchValidation.valid, false);
    assert.ok(patchValidation.errors.some((e) => e.includes("Unapproved schema field")));

    const structuredValidation = validateStructuredLLMOutput(invalidPatch);
    assert.strictEqual(structuredValidation.valid, true);
    assert.strictEqual(
      (structuredValidation.patch as Record<string, unknown>).fakeDiscountPromo,
      undefined,
      "Sanitizer must strip unapproved keys"
    );
  });
});

