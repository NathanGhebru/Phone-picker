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
});

