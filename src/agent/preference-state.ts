import type {
  Eligibility,
  Language,
  Preferences,
  PreferenceUpdate,
  Priority,
} from "../shared/types";
import type { TurnSource } from "./types";

export const ALLOWED_PREFERENCE_KEYS = new Set([
  "language",
  "budgetMonthlyTotal",
  "budgetIncludesDevice",
  "maxDeviceUpfront",
  "lines",
  "devicePurchaseMode",
  "newOrExistingCustomer",
  "priorities",
  "usage",
  "accessibilityNeeds",
  "eligibility",
]);

export const ALLOWED_PRIORITY_KEYS = new Set([
  "camera",
  "battery",
  "displayReadability",
  "simplicity",
  "hotspot",
]);

export const ALLOWED_ELIGIBILITY_KEYS = new Set(["age55Plus"]);

export function createInitialPreferences(language: Language = "en"): Preferences {
  return {
    language,
    budgetMonthlyTotal: null,
    budgetIncludesDevice: null,
    maxDeviceUpfront: null,
    lines: null,
    devicePurchaseMode: "unknown",
    newOrExistingCustomer: "unknown",
    priorities: {
      camera: null,
      battery: null,
      displayReadability: null,
      simplicity: null,
      hotspot: null,
    },
    usage: [],
    accessibilityNeeds: [],
    eligibility: {
      age55Plus: "unknown",
    },
  };
}

export function validatePriorityValue(val: unknown): val is Priority | null {
  if (val === null) return true;
  if (typeof val === "number" && Number.isInteger(val) && val >= 1 && val <= 5) {
    return true;
  }
  return false;
}

export function validateEligibilityValue(val: unknown): val is Eligibility {
  return val === "yes" || val === "no" || val === "unknown";
}

export function validatePreferencePatch(patch: Partial<Preferences>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return { valid: false, errors: ["Patch must be a non-null object"] };
  }

  // Check for unapproved schema extensions
  for (const key of Object.keys(patch)) {
    if (!ALLOWED_PREFERENCE_KEYS.has(key)) {
      errors.push(`Unapproved schema field in patch: '${key}'`);
    }
  }

  if (patch.language !== undefined && patch.language !== "en" && patch.language !== "es") {
    errors.push(`Invalid language '${String(patch.language)}': must be 'en' or 'es'`);
  }

  if (patch.budgetMonthlyTotal !== undefined && patch.budgetMonthlyTotal !== null) {
    if (
      typeof patch.budgetMonthlyTotal !== "number" ||
      !Number.isFinite(patch.budgetMonthlyTotal) ||
      patch.budgetMonthlyTotal <= 0 ||
      patch.budgetMonthlyTotal > 2000
    ) {
      errors.push(
        `Invalid budgetMonthlyTotal '${String(patch.budgetMonthlyTotal)}': must be a finite number between 1 and 2000`
      );
    }
  }

  if (patch.budgetIncludesDevice !== undefined && patch.budgetIncludesDevice !== null) {
    if (typeof patch.budgetIncludesDevice !== "boolean") {
      errors.push(
        `Invalid budgetIncludesDevice '${String(patch.budgetIncludesDevice)}': must be boolean or null`
      );
    }
  }

  if (patch.maxDeviceUpfront !== undefined && patch.maxDeviceUpfront !== null) {
    if (
      typeof patch.maxDeviceUpfront !== "number" ||
      !Number.isFinite(patch.maxDeviceUpfront) ||
      patch.maxDeviceUpfront < 0 ||
      patch.maxDeviceUpfront > 5000
    ) {
      errors.push(
        `Invalid maxDeviceUpfront '${String(patch.maxDeviceUpfront)}': must be a finite number between 0 and 5000`
      );
    }
  }

  if (patch.lines !== undefined && patch.lines !== null) {
    if (
      typeof patch.lines !== "number" ||
      !Number.isInteger(patch.lines) ||
      patch.lines < 1 ||
      patch.lines > 20
    ) {
      errors.push(`Invalid lines '${String(patch.lines)}': must be an integer between 1 and 20`);
    }
  }

  if (patch.devicePurchaseMode !== undefined) {
    if (!["monthly", "upfront", "unknown"].includes(patch.devicePurchaseMode)) {
      errors.push(
        `Invalid devicePurchaseMode '${String(patch.devicePurchaseMode)}': must be 'monthly', 'upfront', or 'unknown'`
      );
    }
  }

  if (patch.newOrExistingCustomer !== undefined) {
    if (!["new", "existing", "unknown"].includes(patch.newOrExistingCustomer)) {
      errors.push(
        `Invalid newOrExistingCustomer '${String(patch.newOrExistingCustomer)}': must be 'new', 'existing', or 'unknown'`
      );
    }
  }

  if (patch.priorities !== undefined) {
    if (!patch.priorities || typeof patch.priorities !== "object" || Array.isArray(patch.priorities)) {
      errors.push("Invalid priorities: must be a non-null object");
    } else {
      for (const pKey of Object.keys(patch.priorities)) {
        if (!ALLOWED_PRIORITY_KEYS.has(pKey)) {
          errors.push(`Unapproved priority field in patch: '${pKey}'`);
        } else {
          const val = (patch.priorities as Record<string, unknown>)[pKey];
          if (!validatePriorityValue(val)) {
            errors.push(`Invalid priority value for '${pKey}': must be null or integer 1-5`);
          }
        }
      }
    }
  }

  if (patch.usage !== undefined) {
    if (!Array.isArray(patch.usage) || patch.usage.some((u) => typeof u !== "string")) {
      errors.push("Invalid usage: must be an array of strings");
    }
  }

  if (patch.accessibilityNeeds !== undefined) {
    if (
      !Array.isArray(patch.accessibilityNeeds) ||
      patch.accessibilityNeeds.some((a) => typeof a !== "string")) {
      errors.push("Invalid accessibilityNeeds: must be an array of strings");
    }
  }

  if (patch.eligibility !== undefined) {
    if (
      !patch.eligibility ||
      typeof patch.eligibility !== "object" ||
      Array.isArray(patch.eligibility)
    ) {
      errors.push("Invalid eligibility: must be a non-null object");
    } else {
      for (const eKey of Object.keys(patch.eligibility)) {
        if (!ALLOWED_ELIGIBILITY_KEYS.has(eKey)) {
          errors.push(`Unapproved eligibility field in patch: '${eKey}'`);
        } else {
          const val = (patch.eligibility as Record<string, unknown>)[eKey];
          if (!validateEligibilityValue(val)) {
            errors.push(`Invalid eligibility value for '${eKey}': must be 'yes', 'no', or 'unknown'`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePreferences(prefs: Preferences): { valid: boolean; errors: string[] } {
  const patchValidation = validatePreferencePatch(prefs);
  const errors = [...patchValidation.errors];

  // Additional required structure checks for complete Preferences object
  if (!prefs.priorities || typeof prefs.priorities !== "object") {
    errors.push("Preferences must have a priorities object");
  } else {
    for (const key of ALLOWED_PRIORITY_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(prefs.priorities, key)) {
        errors.push(`Missing required priority key '${key}' in preferences`);
      }
    }
  }

  if (!prefs.eligibility || typeof prefs.eligibility !== "object") {
    errors.push("Preferences must have an eligibility object");
  } else {
    for (const key of ALLOWED_ELIGIBILITY_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(prefs.eligibility, key)) {
        errors.push(`Missing required eligibility key '${key}' in preferences`);
      }
    }
  }

  if (!Array.isArray(prefs.usage)) {
    errors.push("Preferences.usage must be an array");
  }
  if (!Array.isArray(prefs.accessibilityNeeds)) {
    errors.push("Preferences.accessibilityNeeds must be an array");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Merges a PreferenceUpdate into current Preferences.
 * Follows the approved team convention:
 * - Replaces complete nested objects while preserving unchanged siblings during the merge.
 * - Array fields (usage, accessibilityNeeds) are merged as set unions.
 * - Null and unknown values are faithfully preserved.
 * - Sibling values in priorities and eligibility are preserved when only a partial nested patch is provided.
 */
export function mergePreferences(
  current: Preferences,
  update: PreferenceUpdate
): Preferences {
  const patch = update.patch;

  const mergedPriorities = patch.priorities
    ? {
        camera:
          patch.priorities.camera !== undefined
            ? patch.priorities.camera
            : current.priorities.camera,
        battery:
          patch.priorities.battery !== undefined
            ? patch.priorities.battery
            : current.priorities.battery,
        displayReadability:
          patch.priorities.displayReadability !== undefined
            ? patch.priorities.displayReadability
            : current.priorities.displayReadability,
        simplicity:
          patch.priorities.simplicity !== undefined
            ? patch.priorities.simplicity
            : current.priorities.simplicity,
        hotspot:
          patch.priorities.hotspot !== undefined
            ? patch.priorities.hotspot
            : current.priorities.hotspot,
      }
    : { ...current.priorities };

  const mergedEligibility = patch.eligibility
    ? {
        age55Plus:
          patch.eligibility.age55Plus !== undefined
            ? patch.eligibility.age55Plus
            : current.eligibility.age55Plus,
      }
    : { ...current.eligibility };

  const mergedUsage = patch.usage
    ? Array.from(new Set([...current.usage, ...patch.usage]))
    : [...current.usage];

  const mergedAccessibilityNeeds = patch.accessibilityNeeds
    ? Array.from(new Set([...current.accessibilityNeeds, ...patch.accessibilityNeeds]))
    : [...current.accessibilityNeeds];

  return {
    language: patch.language !== undefined ? patch.language : current.language,
    budgetMonthlyTotal:
      patch.budgetMonthlyTotal !== undefined
        ? patch.budgetMonthlyTotal
        : current.budgetMonthlyTotal,
    budgetIncludesDevice:
      patch.budgetIncludesDevice !== undefined
        ? patch.budgetIncludesDevice
        : current.budgetIncludesDevice,
    maxDeviceUpfront:
      patch.maxDeviceUpfront !== undefined
        ? patch.maxDeviceUpfront
        : current.maxDeviceUpfront,
    lines: patch.lines !== undefined ? patch.lines : current.lines,
    devicePurchaseMode:
      patch.devicePurchaseMode !== undefined
        ? patch.devicePurchaseMode
        : current.devicePurchaseMode,
    newOrExistingCustomer:
      patch.newOrExistingCustomer !== undefined
        ? patch.newOrExistingCustomer
        : current.newOrExistingCustomer,
    priorities: mergedPriorities,
    usage: mergedUsage,
    accessibilityNeeds: mergedAccessibilityNeeds,
    eligibility: mergedEligibility,
  };
}

export function createPreferenceUpdate(
  patch: Partial<Preferences>,
  source: TurnSource,
  evidence?: string
): PreferenceUpdate {
  const validation = validatePreferencePatch(patch);
  if (!validation.valid) {
    throw new Error(`Invalid preference patch: ${validation.errors.join(", ")}`);
  }
  return {
    patch,
    evidence,
    source,
  };
}

