import assert from "node:assert";
import { describe, it } from "node:test";
import {
  createInitialPreferences,
  createPreferenceUpdate,
  mergePreferences,
  validatePreferencePatch,
  validatePreferences,
} from "../preference-state";
import type { Preferences } from "../../shared/types";

describe("Preference State Management & Validation", () => {
  it("initial preferences should have expected defaults", () => {
    const prefs = createInitialPreferences("en");
    assert.strictEqual(prefs.language, "en");
    assert.strictEqual(prefs.budgetMonthlyTotal, null);
    assert.strictEqual(prefs.budgetIncludesDevice, null);
    assert.strictEqual(prefs.maxDeviceUpfront, null);
    assert.strictEqual(prefs.lines, null);
    assert.strictEqual(prefs.devicePurchaseMode, "unknown");
    assert.strictEqual(prefs.newOrExistingCustomer, "unknown");
    assert.deepStrictEqual(prefs.priorities, {
      camera: null,
      battery: null,
      displayReadability: null,
      simplicity: null,
      hotspot: null,
    });
    assert.deepStrictEqual(prefs.usage, []);
    assert.deepStrictEqual(prefs.accessibilityNeeds, []);
    assert.strictEqual(prefs.eligibility.age55Plus, "unknown");

    const validation = validatePreferences(prefs);
    assert.strictEqual(validation.valid, true);
  });

  it("validation rejects unapproved root fields", () => {
    const badPatch: Record<string, unknown> = {
      lines: 2,
      unapprovedField: "not allowed",
    };
    const res = validatePreferencePatch(badPatch as Partial<Preferences>);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("Unapproved schema field in patch: 'unapprovedField'")));
  });

  it("validation rejects invalid priority values", () => {
    const badPatch = {
      priorities: {
        camera: 10 as unknown as 5, // out of range
      },
    };
    const res = validatePreferencePatch(badPatch as Partial<Preferences>);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("Invalid priority value")));
  });

  it("validation rejects negative or extreme budgets", () => {
    const resNegative = validatePreferencePatch({ budgetMonthlyTotal: -20 });
    assert.strictEqual(resNegative.valid, false);

    const resTooLarge = validatePreferencePatch({ budgetMonthlyTotal: 5000 });
    assert.strictEqual(resTooLarge.valid, false);

    const resValid = validatePreferencePatch({ budgetMonthlyTotal: 65 });
    assert.strictEqual(resValid.valid, true);
  });

  it("validation rejects non-integer or out of bounds line counts", () => {
    const resDecimal = validatePreferencePatch({ lines: 1.5 });
    assert.strictEqual(resDecimal.valid, false);

    const resZero = validatePreferencePatch({ lines: 0 });
    assert.strictEqual(resZero.valid, false);

    const resOverMax = validatePreferencePatch({ lines: 25 });
    assert.strictEqual(resOverMax.valid, false);

    const resValid = validatePreferencePatch({ lines: 3 });
    assert.strictEqual(resValid.valid, true);
  });

  it("mergePreferences preserves sibling priorities when partial patch is given", () => {
    const current = createInitialPreferences("en");
    current.priorities.camera = 4;
    current.priorities.battery = 3;
    current.priorities.displayReadability = 5;

    const update = createPreferenceUpdate(
      { priorities: { simplicity: 5 } as Preferences["priorities"] },
      "text"
    );

    const merged = mergePreferences(current, update);
    assert.strictEqual(merged.priorities.camera, 4, "Camera preserved");
    assert.strictEqual(merged.priorities.battery, 3, "Battery preserved");
    assert.strictEqual(merged.priorities.displayReadability, 5, "DisplayReadability preserved");
    assert.strictEqual(merged.priorities.simplicity, 5, "Simplicity updated");
    assert.strictEqual(merged.priorities.hotspot, null, "Hotspot untouched");
  });

  it("mergePreferences preserves sibling eligibility", () => {
    const current = createInitialPreferences("en");
    current.eligibility.age55Plus = "unknown";

    const update = createPreferenceUpdate(
      { eligibility: { age55Plus: "yes" } },
      "voice"
    );

    const merged = mergePreferences(current, update);
    assert.strictEqual(merged.eligibility.age55Plus, "yes");
  });

  it("mergePreferences merges array fields without duplicates", () => {
    const current = createInitialPreferences("en");
    current.usage = ["calls", "youtube"];
    current.accessibilityNeeds = ["readable_text"];

    const update = createPreferenceUpdate(
      {
        usage: ["youtube", "video", "hotspot"],
        accessibilityNeeds: ["readable_text", "simple_navigation"],
      },
      "text"
    );

    const merged = mergePreferences(current, update);
    assert.deepStrictEqual(merged.usage, ["calls", "youtube", "video", "hotspot"]);
    assert.deepStrictEqual(merged.accessibilityNeeds, ["readable_text", "simple_navigation"]);
  });

  it("createPreferenceUpdate throws on invalid patch", () => {
    assert.throws(() => {
      createPreferenceUpdate({ lines: -5 }, "text");
    }, /Invalid preference patch/);
  });
});
