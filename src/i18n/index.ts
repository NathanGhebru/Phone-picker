import type { Language, Priority } from "@/shared/types";
import { enTranslations } from "./en";
import { esTranslations } from "./es";
import type { Translations } from "./types";

export * from "./types";
export { enTranslations } from "./en";
export { esTranslations } from "./es";

export function getTranslations(lang: Language = "en"): Translations {
  return lang === "es" ? esTranslations : enTranslations;
}

/**
 * Format currency in USD with language-appropriate locale.
 * Returns localized "Price unavailable" / "Precio no disponible" when amount is null.
 */
export function formatCurrency(amount: number | null | undefined, lang: Language = "en"): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return getTranslations(lang).recommendations.priceUnavailable;
  }
  const locale = lang === "es" ? "es-US" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Localized reason code translation.
 * If code is unknown, returns explicit code indicator instead of fabricating marketing text.
 */
export function translateReason(code: string, lang: Language = "en"): string {
  const t = getTranslations(lang);
  const matched = t.reasons[code];
  if (matched) {
    return matched;
  }
  return lang === "es"
    ? `Código de motivo '${code}' (definición pendiente del catálogo)`
    : `Reason code '${code}' (definition pending catalog dictionary)`;
}

/**
 * Localized tradeoff code translation.
 * If code is unknown, returns explicit code indicator instead of fabricating text.
 */
export function translateTradeoff(code: string, lang: Language = "en"): string {
  const t = getTranslations(lang);
  const matched = t.tradeoffs[code];
  if (matched) {
    return matched;
  }
  return lang === "es"
    ? `Compromiso '${code}' (definición pendiente del catálogo)`
    : `Tradeoff code '${code}' (definition pending catalog dictionary)`;
}

/**
 * Localized usage label translation.
 */
export function translateUsage(usageKey: string, lang: Language = "en"): string {
  const t = getTranslations(lang);
  return t.usages[usageKey] || usageKey;
}

/**
 * Localized accessibility need translation.
 */
export function translateAccessibilityNeed(needKey: string, lang: Language = "en"): string {
  const t = getTranslations(lang);
  return t.accessibilityOptions[needKey] || needKey;
}

/**
 * Localized priority key translation.
 */
export function translatePriorityKey(
  key: "camera" | "battery" | "displayReadability" | "simplicity" | "hotspot",
  lang: Language = "en"
): string {
  const t = getTranslations(lang);
  return t.preferences.priorities[key] || key;
}

/**
 * Localized priority level descriptor.
 */
export function translatePriorityLevel(level: Priority | null, lang: Language = "en"): string {
  const t = getTranslations(lang);
  if (level === null) return t.common.notSpecified;
  return t.preferences.priorityLevel(level);
}
