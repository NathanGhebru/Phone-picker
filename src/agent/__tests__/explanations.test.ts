import assert from "node:assert";
import { describe, it } from "node:test";
import {
  explainCheaperAlternative,
  explainRecommendation,
  explainTerm,
  translateReasonCode,
  translateTradeoffCode,
} from "../explanations";
import { MOCK_FIXTURE_EN_RECOMMENDATIONS } from "../fixtures";

describe("Explanations Module", () => {
  it("explains terms accurately in English and Spanish", () => {
    const enHotspot = explainTerm("hotspot", "en");
    assert.ok(enHotspot.includes("portable Wi-Fi"));

    const esHotspot = explainTerm("hotspot", "es");
    assert.ok(esHotspot.includes("Wi-Fi portátil"));

    const en5g = explainTerm("5G", "en");
    assert.ok(en5g.includes("generation"));

    const es5g = explainTerm("5G", "es");
    assert.ok(es5g.includes("generación actual"));
  });

  it("handles unknown terms with an honest disclaimer", () => {
    const unknownEn = explainTerm("quantum_teleportation", "en");
    assert.ok(unknownEn.includes("don't have a definition"));

    const unknownEs = explainTerm("quantum_teleportation", "es");
    assert.ok(unknownEs.includes("No tengo una definición"));
  });

  it("translates verified reason codes and flags unknown codes explicitly", () => {
    const knownEn = translateReasonCode("budget_fit", "en");
    assert.ok(knownEn.includes("Fits comfortably"));

    const knownEs = translateReasonCode("budget_fit", "es");
    assert.ok(knownEs.includes("Se ajusta"));

    const unknown = translateReasonCode("unlisted_reason_xyz", "en");
    assert.strictEqual(
      unknown,
      "Reason code 'unlisted_reason_xyz' (definition pending catalog dictionary)"
    );
  });

  it("translates verified tradeoff codes and flags unknown codes explicitly", () => {
    const knownEn = translateTradeoffCode("entry_level_camera", "en");
    assert.ok(knownEn.includes("Basic camera"));

    const unknown = translateTradeoffCode("unknown_tradeoff_xyz", "en");
    assert.strictEqual(
      unknown,
      "Tradeoff code 'unknown_tradeoff_xyz' (definition pending catalog dictionary)"
    );
  });

  it("explains recommendations in English and Spanish", () => {
    const rec = MOCK_FIXTURE_EN_RECOMMENDATIONS.recommendations[0];
    const enText = explainRecommendation(rec, "en");
    assert.ok(enText.includes("samsung-galaxy-a15-5g"));
    assert.ok(enText.includes("$58/month"));

    const esText = explainRecommendation(rec, "es");
    assert.ok(esText.includes("samsung-galaxy-a15-5g"));
    assert.ok(esText.includes("$58/mes"));
  });

  it("explains cheaper alternatives correctly when available", () => {
    const recs = MOCK_FIXTURE_EN_RECOMMENDATIONS.recommendations;
    const res = explainCheaperAlternative(recs, "rec-1-best", "en");
    assert.strictEqual(res.foundCheaper, true);
    assert.strictEqual(res.cheaperRecommendation?.id, "rec-2-lowest");
    assert.ok(res.text.includes("$54/month"));
  });

  it("explains when no cheaper alternative is available", () => {
    const recs = MOCK_FIXTURE_EN_RECOMMENDATIONS.recommendations;
    const res = explainCheaperAlternative(recs, "rec-2-lowest", "en");
    assert.strictEqual(res.foundCheaper, false);
    assert.strictEqual(res.cheaperRecommendation, null);
    assert.ok(res.text.includes("already the lowest-cost"));
  });

  it("verifies all backend recommendation engine reason codes have English and Spanish explanations", () => {
    const backendReasonCodes = [
      "WITHIN_CONFIRMED_COMBINED_BUDGET",
      "HIGH_READABILITY_HEURISTIC",
      "STRONG_BATTERY_HEURISTIC",
      "STRONG_CAMERA_HEURISTIC",
      "SIMPLE_USE_HEURISTIC",
      "SUPPORTS_HIGHER_USAGE_HEURISTIC",
      "ELIGIBLE_VERIFIED_PRICE_OPTION",
    ];

    for (const code of backendReasonCodes) {
      const en = translateReasonCode(code, "en");
      const es = translateReasonCode(code, "es");
      assert.ok(!en.includes("definition pending"), `Reason code ${code} should have English translation, got: ${en}`);
      assert.ok(!es.includes("definición pendiente"), `Reason code ${code} should have Spanish translation, got: ${es}`);
      assert.ok(en.length > 5);
      assert.ok(es.length > 5);
    }
  });

  it("verifies all backend recommendation engine tradeoff codes have English and Spanish explanations", () => {
    const backendTradeoffCodes = [
      "ACCESSIBILITY_COMPATIBILITY_UNVERIFIED",
      "DEVICE_MONTHLY_PRICE_UNAVAILABLE",
      "DEVICE_FINANCING_ESTIMATE_EXCLUDES_TAXES_FEES_CREDITS",
      "TAXES_AND_FEES_EXCLUDED_FROM_MONTHLY_ESTIMATE",
      "LOWER_CAMERA_HEURISTIC",
    ];

    for (const code of backendTradeoffCodes) {
      const en = translateTradeoffCode(code, "en");
      const es = translateTradeoffCode(code, "es");
      assert.ok(!en.includes("definition pending"), `Tradeoff code ${code} should have English translation, got: ${en}`);
      assert.ok(!es.includes("definición pendiente"), `Tradeoff code ${code} should have Spanish translation, got: ${es}`);
      assert.ok(en.length > 5);
      assert.ok(es.length > 5);
    }
  });
});

