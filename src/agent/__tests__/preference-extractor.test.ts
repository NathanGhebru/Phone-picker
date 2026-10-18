import assert from "node:assert";
import { describe, it } from "node:test";
import {
  extractFromUtterance,
  validateStructuredLLMOutput,
} from "../preference-extractor";

describe("Preference Extractor", () => {
  describe("English Utterances", () => {
    it("extracts needs, large text, and streaming usage", () => {
      const res = extractFromUtterance(
        "My mom needs a phone for YouTube and reading larger text."
      );
      assert.strictEqual(res.intent, "preference_statement");
      assert.strictEqual(res.patch.priorities?.displayReadability, 5);
      assert.ok(res.patch.usage?.includes("youtube"));
      assert.ok(res.patch.accessibilityNeeds?.includes("readable_text"));
    });

    it("extracts line count and combined budget", () => {
      const res = extractFromUtterance("One line, $60 including the device.");
      assert.strictEqual(res.patch.lines, 1);
      assert.strictEqual(res.patch.budgetMonthlyTotal, 60);
      assert.strictEqual(res.patch.budgetIncludesDevice, true);
    });

    it("extracts budget with plan-only scope", () => {
      const res = extractFromUtterance("I want to spend $45 just for the plan.");
      assert.strictEqual(res.patch.budgetMonthlyTotal, 45);
      assert.strictEqual(res.patch.budgetIncludesDevice, false);
    });

    it("extracts standalone budget leaving budgetIncludesDevice undefined in patch", () => {
      const res = extractFromUtterance("I have about $50 to spend each month.");
      assert.strictEqual(res.patch.budgetMonthlyTotal, 50);
      assert.strictEqual(res.patch.budgetIncludesDevice, undefined);
    });

    it("detects explicit correction", () => {
      const res = extractFromUtterance("Actually, make that $40.");
      assert.strictEqual(res.intent, "correction");
      assert.strictEqual(res.patch.budgetMonthlyTotal, 40);
    });

    it("detects cheaper option request", () => {
      const res = extractFromUtterance("Make it cheaper.");
      assert.strictEqual(res.intent, "cheaper_alternative");
    });

    it("detects why recommendation request", () => {
      const res = extractFromUtterance("Why did you recommend this one?");
      assert.strictEqual(res.intent, "explain_recommendation");
    });

    it("detects terminology questions", () => {
      const resHotspot = extractFromUtterance("What is hotspot?");
      assert.strictEqual(resHotspot.intent, "explain_term");
      assert.strictEqual(resHotspot.entities.termToExplain, "hotspot");

      const resData = extractFromUtterance("Explain mobile data");
      assert.strictEqual(resData.intent, "explain_term");
      assert.strictEqual(resData.entities.termToExplain, "mobile_data");

      const res5g = extractFromUtterance("What's 5G?");
      assert.strictEqual(res5g.intent, "explain_term");
      assert.strictEqual(res5g.entities.termToExplain, "5G");
    });

    it("does not infer 55+ eligibility from parent age mention", () => {
      const res = extractFromUtterance("It's for my mom, she is 80.");
      assert.strictEqual(res.patch.eligibility, undefined);
    });

    it("infers 55+ eligibility when self-identified", () => {
      const res = extractFromUtterance("I am 62 years old and need 1 line.");
      assert.strictEqual(res.patch.eligibility?.age55Plus, "yes");
    });
  });

  describe("Spanish Utterances", () => {
    it("extracts Spanish needs, large text, and streaming", () => {
      const res = extractFromUtterance(
        "Mi mamá necesita un teléfono para ver YouTube y leer letras grandes.",
        "es"
      );
      assert.strictEqual(res.intent, "preference_statement");
      assert.strictEqual(res.patch.priorities?.displayReadability, 5);
      assert.ok(res.patch.usage?.includes("youtube"));
      assert.ok(res.patch.accessibilityNeeds?.includes("readable_text"));
    });

    it("extracts Spanish line count and budget with device", () => {
      const res = extractFromUtterance(
        "Una línea, 60 dólares incluyendo el teléfono.",
        "es"
      );
      assert.strictEqual(res.patch.lines, 1);
      assert.strictEqual(res.patch.budgetMonthlyTotal, 60);
      assert.strictEqual(res.patch.budgetIncludesDevice, true);
    });

    it("detects Spanish correction", () => {
      const res = extractFromUtterance("En realidad, quería decir 40 dólares.", "es");
      assert.strictEqual(res.intent, "correction");
      assert.strictEqual(res.patch.budgetMonthlyTotal, 40);
    });

    it("detects Spanish cheaper option request", () => {
      const res = extractFromUtterance("Hazlo más barato.", "es");
      assert.strictEqual(res.intent, "cheaper_alternative");
    });

    it("detects Spanish why recommendation request", () => {
      const res = extractFromUtterance("¿Por qué me recomiendas este?", "es");
      assert.strictEqual(res.intent, "explain_recommendation");
    });

    it("detects Spanish terminology questions", () => {
      const res = extractFromUtterance("¿Qué es un punto de acceso móvil?", "es");
      assert.strictEqual(res.intent, "explain_term");
      assert.strictEqual(res.entities.termToExplain, "hotspot");

      const resData = extractFromUtterance("¿Qué son los datos móviles?", "es");
      assert.strictEqual(resData.intent, "explain_term");
      assert.strictEqual(resData.entities.termToExplain, "mobile_data");
    });
  });

  describe("Structured LLM Output Validation", () => {
    it("validates and sanitizes structured LLM outputs", () => {
      const input = {
        lines: 2,
        budgetMonthlyTotal: 75.8,
        budgetIncludesDevice: true,
        priorities: {
          displayReadability: 4,
          invalidKey: "ignored",
        },
        usage: ["calls", 123], // invalid item filtered
        unapprovedField: "danger",
      };

      const result = validateStructuredLLMOutput(input);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.patch?.lines, 2);
      assert.strictEqual(result.patch?.budgetMonthlyTotal, 76);
      assert.strictEqual(result.patch?.budgetIncludesDevice, true);
      assert.strictEqual(result.patch?.priorities?.displayReadability, 4);
      assert.deepStrictEqual(result.patch?.usage, ["calls"]);
      assert.strictEqual((result.patch as Record<string, unknown>).unapprovedField, undefined);
    });
  });
});

