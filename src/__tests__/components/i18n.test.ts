import * as assert from "node:assert";
import { describe, it } from "node:test";
import {
  formatCurrency,
  getTranslations,
  translateAccessibilityNeed,
  translatePriorityKey,
  translatePriorityLevel,
  translateReason,
  translateTradeoff,
  translateUsage,
} from "../../i18n";

describe("VoiceMatch i18n and Localization API", () => {
  it("provides complete translations for both English and Spanish", () => {
    const en = getTranslations("en");
    const es = getTranslations("es");

    assert.strictEqual(en.common.appName, "VoiceMatch");
    assert.strictEqual(es.common.appName, "VoiceMatch");

    // UI Action labels
    assert.ok(en.voiceControl.startListening.length > 0);
    assert.ok(es.voiceControl.startListening.length > 0);
    assert.notStrictEqual(en.voiceControl.startListening, es.voiceControl.startListening);

    assert.ok(en.voiceControl.stopListening.length > 0);
    assert.ok(es.voiceControl.stopListening.length > 0);

    // Chat input
    assert.ok(en.chatInput.sendButton.length > 0);
    assert.ok(es.chatInput.sendButton.length > 0);
    assert.ok(en.chatInput.typeInsteadHeading.length > 0);
    assert.ok(es.chatInput.typeInsteadHeading.length > 0);

    // Results labels
    assert.strictEqual(en.recommendations.labels.best_match, "Best Match");
    assert.strictEqual(es.recommendations.labels.best_match, "Mejor Opción");

    assert.strictEqual(en.recommendations.labels.lowest_cost, "Lowest Cost");
    assert.strictEqual(es.recommendations.labels.lowest_cost, "Menor Costo");

    assert.strictEqual(en.recommendations.labels.alternative, "Alternative Option");
    assert.strictEqual(es.recommendations.labels.alternative, "Opción Alternativa");
  });

  it("formats currency correctly and handles unavailable prices honestly", () => {
    // Valid numbers
    const formattedEn = formatCurrency(60, "en");
    assert.ok(formattedEn.includes("60"));
    assert.ok(formattedEn.includes("$"));

    const formattedEs = formatCurrency(60, "es");
    assert.ok(formattedEs.includes("60"));

    // Null or undefined values must return localized Price unavailable, never $0
    const nullEn = formatCurrency(null, "en");
    assert.strictEqual(nullEn, "Price unavailable");

    const nullEs = formatCurrency(null, "es");
    assert.strictEqual(nullEs, "Precio no disponible");

    const undefinedEn = formatCurrency(undefined, "en");
    assert.strictEqual(undefinedEn, "Price unavailable");
  });

  it("translates known reason codes correctly", () => {
    const reasonEn = translateReason("budget_fit", "en");
    assert.strictEqual(reasonEn, "Fits comfortably within your specified monthly budget");

    const reasonEs = translateReason("budget_fit", "es");
    assert.strictEqual(reasonEs, "Se ajusta cómodamente al presupuesto mensual indicado");

    const displayEn = translateReason("large_display", "en");
    assert.strictEqual(displayEn, "Large, readable display that makes text and apps easy to see");
  });

  it("handles unknown reason codes without fabricating descriptions", () => {
    const unknownEn = translateReason("unknown_special_code", "en");
    assert.ok(unknownEn.includes("unknown_special_code"));
    assert.ok(unknownEn.includes("definition pending"));

    const unknownEs = translateReason("unknown_special_code", "es");
    assert.ok(unknownEs.includes("unknown_special_code"));
    assert.ok(unknownEs.includes("definición pendiente"));
  });

  it("translates known tradeoff codes and handles unknown codes honestly", () => {
    const tradeoffEn = translateTradeoff("higher_device_cost", "en");
    assert.strictEqual(tradeoffEn, "Device monthly cost is higher than other alternatives");

    const tradeoffEs = translateTradeoff("higher_device_cost", "es");
    assert.strictEqual(tradeoffEs, "El costo mensual del dispositivo es más alto que otras alternativas");

    const unknownEn = translateTradeoff("custom_tradeoff", "en");
    assert.ok(unknownEn.includes("custom_tradeoff"));
    assert.ok(unknownEn.includes("definition pending"));
  });

  it("translates usage and accessibility needs", () => {
    assert.strictEqual(translateUsage("calls", "en"), "Phone calls");
    assert.strictEqual(translateUsage("calls", "es"), "Llamadas telefónicas");

    assert.strictEqual(translateAccessibilityNeed("readable_text", "en"), "Large text & high readability");
    assert.strictEqual(translateAccessibilityNeed("readable_text", "es"), "Texto grande y alta legibilidad");
  });

  it("translates priority keys and levels", () => {
    assert.strictEqual(translatePriorityKey("displayReadability", "en"), "Large / Easy-to-Read Screen");
    assert.strictEqual(translatePriorityKey("displayReadability", "es"), "Pantalla grande y fácil de leer");

    assert.strictEqual(translatePriorityLevel(5, "en"), "Must have");
    assert.strictEqual(translatePriorityLevel(5, "es"), "Indispensable");
    assert.strictEqual(translatePriorityLevel(1, "en"), "Not important");
    assert.strictEqual(translatePriorityLevel(null, "en"), "Not specified");
  });
});
