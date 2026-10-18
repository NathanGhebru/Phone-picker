import type {
  Eligibility,
  Language,
  Preferences,
  Priority,
} from "../shared/types";
import {
  validatePreferencePatch,
} from "./preference-state";
import type {
  DetectedIntentType,
  ExtractedEntities,
} from "./types";

/**
 * Validates and sanitizes structured LLM output attempting to produce a preference patch.
 * This guarantees that free-form LLM output cannot directly mutate Preferences or inject unapproved keys.
 */
export function validateStructuredLLMOutput(data: unknown): {
  valid: boolean;
  patch?: Partial<Preferences>;
  errors: string[];
} {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      valid: false,
      errors: ["Structured LLM output must be a non-null object"],
    };
  }

  const raw = data as Record<string, unknown>;
  const cleanPatch: Partial<Preferences> = {};

  if (raw.language === "en" || raw.language === "es") {
    cleanPatch.language = raw.language;
  }

  if (raw.budgetMonthlyTotal !== undefined) {
    if (raw.budgetMonthlyTotal === null) {
      cleanPatch.budgetMonthlyTotal = null;
    } else if (
      typeof raw.budgetMonthlyTotal === "number" &&
      Number.isFinite(raw.budgetMonthlyTotal) &&
      raw.budgetMonthlyTotal > 0 &&
      raw.budgetMonthlyTotal <= 2000
    ) {
      cleanPatch.budgetMonthlyTotal = Math.round(raw.budgetMonthlyTotal);
    }
  }

  if (raw.budgetIncludesDevice !== undefined) {
    if (raw.budgetIncludesDevice === null || typeof raw.budgetIncludesDevice === "boolean") {
      cleanPatch.budgetIncludesDevice = raw.budgetIncludesDevice;
    }
  }

  if (raw.maxDeviceUpfront !== undefined) {
    if (raw.maxDeviceUpfront === null) {
      cleanPatch.maxDeviceUpfront = null;
    } else if (
      typeof raw.maxDeviceUpfront === "number" &&
      Number.isFinite(raw.maxDeviceUpfront) &&
      raw.maxDeviceUpfront >= 0 &&
      raw.maxDeviceUpfront <= 5000
    ) {
      cleanPatch.maxDeviceUpfront = Math.round(raw.maxDeviceUpfront);
    }
  }

  if (raw.lines !== undefined) {
    if (raw.lines === null) {
      cleanPatch.lines = null;
    } else if (
      typeof raw.lines === "number" &&
      Number.isInteger(raw.lines) &&
      raw.lines >= 1 &&
      raw.lines <= 20
    ) {
      cleanPatch.lines = raw.lines;
    }
  }

  if (raw.devicePurchaseMode === "monthly" || raw.devicePurchaseMode === "upfront" || raw.devicePurchaseMode === "unknown") {
    cleanPatch.devicePurchaseMode = raw.devicePurchaseMode;
  }

  if (raw.newOrExistingCustomer === "new" || raw.newOrExistingCustomer === "existing" || raw.newOrExistingCustomer === "unknown") {
    cleanPatch.newOrExistingCustomer = raw.newOrExistingCustomer;
  }

  if (raw.priorities && typeof raw.priorities === "object" && !Array.isArray(raw.priorities)) {
    const p = raw.priorities as Record<string, unknown>;
    const cleanPriorities: Partial<Preferences["priorities"]> = {};
    for (const k of ["camera", "battery", "displayReadability", "simplicity", "hotspot"] as const) {
      if (p[k] === null) {
        cleanPriorities[k] = null;
      } else if (typeof p[k] === "number" && Number.isInteger(p[k]) && (p[k] as number) >= 1 && (p[k] as number) <= 5) {
        cleanPriorities[k] = p[k] as Priority;
      }
    }
    if (Object.keys(cleanPriorities).length > 0) {
      cleanPatch.priorities = cleanPriorities as Preferences["priorities"];
    }
  }

  if (Array.isArray(raw.usage)) {
    cleanPatch.usage = raw.usage.filter((u): u is string => typeof u === "string");
  }

  if (Array.isArray(raw.accessibilityNeeds)) {
    cleanPatch.accessibilityNeeds = raw.accessibilityNeeds.filter((a): a is string => typeof a === "string");
  }

  if (raw.eligibility && typeof raw.eligibility === "object" && !Array.isArray(raw.eligibility)) {
    const e = raw.eligibility as Record<string, unknown>;
    if (e.age55Plus === "yes" || e.age55Plus === "no" || e.age55Plus === "unknown") {
      cleanPatch.eligibility = { age55Plus: e.age55Plus };
    }
  }

  const validation = validatePreferencePatch(cleanPatch);
  return {
    valid: validation.valid,
    patch: validation.valid ? cleanPatch : undefined,
    errors: validation.errors,
  };
}

/**
 * Extracts entities, intents, and canonical preferences from natural English or Spanish speech or typed text.
 */
export function extractFromUtterance(
  text: string,
  language: Language = "en"
): {
  intent: DetectedIntentType;
  entities: ExtractedEntities;
  patch: Partial<Preferences>;
} {
  const normalized = text.toLowerCase().trim();
  const entities: ExtractedEntities = { language };
  const patch: Partial<Preferences> = {};

  // Check for terminology questions first
  const term = detectTerminologyQuestion(normalized);
  if (term) {
    entities.termToExplain = term;
    return {
      intent: "explain_term",
      entities,
      patch: {},
    };
  }

  // Check for "Why did you recommend this?" / "¿Por qué me recomiendas este?"
  if (isWhyQuestion(normalized)) {
    entities.requestedWhy = true;
    return {
      intent: "explain_recommendation",
      entities,
      patch: {},
    };
  }

  // Check for "Make it cheaper" / "Hazlo más barato"
  if (isCheaperRequest(normalized)) {
    entities.requestedCheaper = true;
    return {
      intent: "cheaper_alternative",
      entities,
      patch: {},
    };
  }

  // Check for greetings with no preferences
  if (isGreetingOnly(normalized)) {
    return {
      intent: "greeting",
      entities,
      patch: {},
    };
  }

  // Check for explicit correction markers ("Actually, I meant...", "En realidad, quería decir...")
  const isCorrection = isCorrectionMarker(normalized);
  entities.isCorrection = isCorrection;

  // Extract budget
  const budgetInfo = extractBudget(normalized);
  if (budgetInfo.amount !== null) {
    entities.budgetMonthlyTotal = budgetInfo.amount;
    patch.budgetMonthlyTotal = budgetInfo.amount;
    if (budgetInfo.includesDevice !== null) {
      entities.budgetIncludesDevice = budgetInfo.includesDevice;
      patch.budgetIncludesDevice = budgetInfo.includesDevice;
    }
  } else if (budgetInfo.includesDevice !== null) {
    entities.budgetIncludesDevice = budgetInfo.includesDevice;
    patch.budgetIncludesDevice = budgetInfo.includesDevice;
  }

  // Extract lines
  const lines = extractLines(normalized);
  if (lines !== null) {
    entities.lines = lines;
    patch.lines = lines;
  }

  // Extract usage & accessibility priorities
  const { priorities, usage, accessibilityNeeds } = extractNeedsAndPriorities(normalized);
  if (Object.keys(priorities).length > 0) {
    entities.priorities = priorities;
    patch.priorities = priorities as Preferences["priorities"];
  }
  if (usage.length > 0) {
    entities.usage = usage;
    patch.usage = usage;
  }
  if (accessibilityNeeds.length > 0) {
    entities.accessibilityNeeds = accessibilityNeeds;
    patch.accessibilityNeeds = accessibilityNeeds;
  }

  // Extract customer status
  const customerStatus = extractCustomerStatus(normalized);
  if (customerStatus !== null) {
    entities.newOrExistingCustomer = customerStatus;
    patch.newOrExistingCustomer = customerStatus;
  }

  // Extract purchase mode
  const purchaseMode = extractPurchaseMode(normalized);
  if (purchaseMode !== null) {
    entities.devicePurchaseMode = purchaseMode;
    patch.devicePurchaseMode = purchaseMode;
  }

  // Extract age 55+ eligibility ONLY if user explicitly confirms self eligibility
  const eligibility = extractEligibility(normalized);
  if (eligibility !== null) {
    entities.age55Plus = eligibility;
    patch.eligibility = { age55Plus: eligibility };
  }

  const hasExtractedPreferences = Object.keys(patch).length > 0;
  const intent: DetectedIntentType = isCorrection
    ? "correction"
    : hasExtractedPreferences
    ? "preference_statement"
    : "unclear";

  return {
    intent,
    entities,
    patch,
  };
}

function detectTerminologyQuestion(text: string): string | null {
  // English questions: "what is hotspot", "what's a hotspot", "explain hotspot", "what does hotspot mean"
  // Spanish questions: "¿qué es un punto de acceso móvil?", "¿qué es hotspot?", "¿qué significa datos móviles?"
  const termPatterns: Array<{ term: string; patterns: RegExp[] }> = [
    {
      term: "hotspot",
      patterns: [
        /\b(?:what(?:'s|\s+is)|\bexplain|\bwhat\s+does)\s+(?:a\s+)?hotspot\b/i,
        /\b(?:hotspot\s+mean)\b/i,
        /¿?\s*qu[eé]\s+(?:es|significa)\s+(?:un\s+)?(?:punto\s+de\s+acceso(?:\s+m[oó]vil)?|hotspot)\b/i,
        /\b(?:explicar|expl[ií]came)\s+(?:el\s+)?(?:punto\s+de\s+acceso|hotspot)\b/i,
      ],
    },
    {
      term: "mobile_data",
      patterns: [
        /\b(?:what(?:'s|\s+is)|\bexplain|\bwhat\s+does)\s+(?:mobile\s+data|cellular\s+data|data)\b/i,
        /\b(?:mobile\s+data\s+mean)\b/i,
        /¿?\s*qu[eé]\s+(?:es|significa|son)\s+(?:los\s+)?datos\s+m[oó]viles\b/i,
      ],
    },
    {
      term: "5G",
      patterns: [
        /\b(?:what(?:'s|\s+is)|\bexplain)\s+5g\b/i,
        /¿?\s*qu[eé]\s+(?:es|significa)\s+5g\b/i,
      ],
    },
    {
      term: "autopay",
      patterns: [
        /\b(?:what(?:'s|\s+is)|\bexplain)\s+autopay\b/i,
        /¿?\s*qu[eé]\s+(?:es|significa)\s+(?:el\s+)?pago\s+autom[aá]tico\b/i,
      ],
    },
    {
      term: "financing",
      patterns: [
        /\b(?:what(?:'s|\s+is)|\bexplain)\s+(?:device\s+)?financing\b/i,
        /¿?\s*qu[eé]\s+(?:es|significa)\s+(?:el\s+)?financiamiento\b/i,
      ],
    },
  ];

  for (const item of termPatterns) {
    for (const pat of item.patterns) {
      if (pat.test(text)) {
        return item.term;
      }
    }
  }

  // Generic fallback if asking "what is X"
  const genericEn = /(?:what(?:'s|\s+is)|explain|what\s+does)\s+(?:a\s+|an\s+|the\s+)?([a-z0-9\s]+?)(?:\s+mean)?(?:\?|$)/i.exec(text);
  if (genericEn && genericEn[1]) {
    const candidate = genericEn[1].trim();
    if (["hotspot", "punto de acceso", "data", "datos móviles", "5g"].includes(candidate)) {
      return candidate;
    }
  }

  const genericEs = /¿?\s*qu[eé]\s+(?:es|son|significa)\s+(?:el\s+|la\s+|los\s+|un\s+)?([a-z0-9\s]+?)(?:\?|$)/i.exec(text);
  if (genericEs && genericEs[1]) {
    const candidate = genericEs[1].trim();
    if (candidate.includes("punto de acceso") || candidate.includes("hotspot")) return "hotspot";
    if (candidate.includes("datos")) return "mobile_data";
    if (candidate.includes("5g")) return "5G";
  }

  return null;
}

function isWhyQuestion(text: string): boolean {
  return (
    /\bwhy\s+(?:did\s+you\s+recommend|this\s+one|recommend\s+this|that\s+one)\b/i.test(text) ||
    /\bwhy\s+this\b/i.test(text) ||
    /¿?\s*por\s*qu[eé]\s+(?:me\s+recomiendas?\s+(?:este|ese|este\s+tel[eé]fono)|este|ese)\b/i.test(text) ||
    /¿?\s*por\s*qu[eé]\s+este\b/i.test(text)
  );
}

function isCheaperRequest(text: string): boolean {
  return (
    /\b(?:make\s+it\s+cheaper|cheaper\s+options?|cheaper\s+alternatives?|something\s+cheaper|anything\s+cheaper)\b/i.test(text) ||
    /\b(?:more\s+affordable|lower\s+price|lower\s+the\s+budget)\b/i.test(text) ||
    /\b(?:hazlo\s+m[aá]s\s+barato|algo\s+m[aá]s\s+barato|opci[oó]n\s+m[aá]s\s+barata|m[aá]s\s+econ[oó]mico)\b/i.test(text) ||
    /¿?\s*(?:hay\s+algo\s+m[aá]s\s+barato)\b/i.test(text)
  );
}

function isGreetingOnly(text: string): boolean {
  return /^(?:hi|hello|hey|good\s+morning|good\s+afternoon|hola|buenos\s+d[ií]as|buenas\s+tardes)[!.\s]*$/i.test(
    text
  );
}

function isCorrectionMarker(text: string): boolean {
  return (
    /\b(?:actually|i\s+meant|make\s+that|instead\s+of|change\s+that\s+to|correction)\b/i.test(text) ||
    /\b(?:en\s+realidad|quer[ií]a\s+decir|quise\s+decir|mejor\s+dicho|cambiar\s+a)\b/i.test(text)
  );
}

function extractBudget(text: string): { amount: number | null; includesDevice: boolean | null } {
  let amount: number | null = null;
  let includesDevice: boolean | null = null;

  // Pattern for "$40", "40 dollars", "40 dólares", "presupuesto de 60"
  // Words to numbers: "sixty" / "sesenta" / "forty" / "cuarenta"
  const wordNumbers: Record<string, number> = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    veinte: 20,
    treinta: 30,
    cuarenta: 40,
    cincuenta: 50,
    sesenta: 60,
    setenta: 70,
    ochenta: 80,
    noventa: 90,
    cien: 100,
  };

  const regexDollar = /\$\s*(\d{1,4})/i;
  const regexWord = /\b(\d{1,4})\s*(?:dollars?|d[oó]lares|bucks)\b/i;
  const regexBudgetWord = /(?:budget\s+is|spend\s+(?:about\s+)?|presupuesto\s+(?:es\s+de\s+)?|gastar\s+(?:unos\s+)?)\s*(?:about\s+)?(?:\$)?\s*(\d{1,4})/i;
  const regexNamed = new RegExp(
    `\\b(${Object.keys(wordNumbers).join("|")})\\s*(?:dollars?|d[oó]lares|al\\s+mes|a\\s+month)?\\b`,
    "i"
  );

  const matchDollar = regexDollar.exec(text);
  const matchWord = regexWord.exec(text);
  const matchBudget = regexBudgetWord.exec(text);
  const matchNamed = regexNamed.exec(text);

  if (matchDollar) {
    amount = parseInt(matchDollar[1], 10);
  } else if (matchWord) {
    amount = parseInt(matchWord[1], 10);
  } else if (matchBudget) {
    amount = parseInt(matchBudget[1], 10);
  } else if (matchNamed) {
    const word = matchNamed[1].toLowerCase();
    if (wordNumbers[word]) {
      amount = wordNumbers[word];
    }
  }

  // Standalone numbers in correction context e.g. "Actually, 40." or "Actually, make that 40."
  if (amount === null && isCorrectionMarker(text)) {
    const standalone = /\b(\d{2,4})\b/.exec(text);
    if (standalone) {
      amount = parseInt(standalone[1], 10);
    }
  }

  // Check device inclusion:
  // "including the phone", "including the device", "including phone", "incluyendo el teléfono", "con el teléfono"
  if (
    /\b(?:including\s+(?:the\s+)?(?:phone|device)|with\s+(?:the\s+)?(?:phone|device)|phone\s+included)\b/i.test(
      text
    ) ||
    /\b(?:incluyendo\s+(?:el\s+)?(?:tel[eé]fono|dispositivo|celular)|con\s+el\s+tel[eé]fono)\b/i.test(
      text
    )
  ) {
    includesDevice = true;
  } else if (
    /\b(?:just\s+(?:for\s+)?the\s+plan|plan\s+only|service\s+only|without\s+(?:the\s+)?phone)\b/i.test(
      text
    ) ||
    /\b(?:solo\s+(?:el\s+)?plan|solo\s+servicio|sin\s+(?:el\s+)?tel[eé]fono)\b/i.test(
      text
    )
  ) {
    includesDevice = false;
  }

  return { amount, includesDevice };
}

function extractLines(text: string): number | null {
  // "one line", "1 line", "una línea", "1 línea", "two lines", "dos líneas"
  const wordToNum: Record<string, number> = {
    one: 1,
    single: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    una: 1,
    un: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
  };

  const digitsMatch = /\b(\d{1,2})\s*(?:lines?|l[ií]neas?)\b/i.exec(text);
  if (digitsMatch) {
    return parseInt(digitsMatch[1], 10);
  }

  const wordsMatch = new RegExp(
    `\\b(${Object.keys(wordToNum).join("|")})\\s*(?:lines?|l[ií]neas?)\\b`,
    "i"
  ).exec(text);
  if (wordsMatch) {
    return wordToNum[wordsMatch[1].toLowerCase()] ?? null;
  }

  if (/\b(?:just\s+me|only\s+for\s+me|solo\s+para\s+m[ií]|para\s+mi\s+mam[aá]|for\s+my\s+mom)\b/i.test(text)) {
    // If user says "for my mom" and mentions no other lines, and specifies "one line" or singular context
    if (/\b(?:a\s+phone|un\s+tel[eé]fono)\b/i.test(text) && !/\b(?:lines?|l[ií]neas?)\b/i.test(text)) {
      // Keep null unless explicitly requested, or if explicitly singular:
      // Leave null if line count was not explicit to allow policy to ask follow up!
    }
  }

  return null;
}

function extractNeedsAndPriorities(text: string): {
  priorities: Partial<Preferences["priorities"]>;
  usage: string[];
  accessibilityNeeds: string[];
} {
  const priorities: Partial<Preferences["priorities"]> = {};
  const usage: string[] = [];
  const accessibilityNeeds: string[] = [];

  // YouTube / Video
  if (/\b(?:youtube|videos?|streaming|ver\s+videos?)\b/i.test(text)) {
    usage.push("youtube", "video");
  }

  // Calling / Calls
  if (/\b(?:calling|calls|phone\s+calls|llamar|llamadas|hablar\s+con)\b/i.test(text)) {
    usage.push("calls");
  }

  // Display Readability / Large text / font size
  if (
    /\b(?:large\s+(?:readable\s+)?text|reading\s+larger\s+text|bigger\s+text|hard\s+to\s+read|readability|can(?:'t|\s+not)\s+read\s+small\s+text)\b/i.test(
      text
    ) ||
    /\b(?:letras?\s+grandes?|texto\s+grande|cuesta\s+leer|dif[ií]cil\s+de\s+leer|pantalla\s+grande)\b/i.test(
      text
    )
  ) {
    priorities.displayReadability = 5;
    accessibilityNeeds.push("readable_text");
  }

  // Simplicity
  if (
    /\b(?:simple|easy\s+to\s+use|not\s+too\s+complicated|straightforward|sencillo|f[aá]cil\s+de\s+usar|no\s+muy\s+complicado)\b/i.test(
      text
    )
  ) {
    priorities.simplicity = 5;
  }

  // Good camera
  if (/\b(?:good\s+camera|great\s+photos?|pictures?|buena\s+c[aá]mara|buenas\s+fotos)\b/i.test(text)) {
    priorities.camera = 4;
  }

  // Battery life
  if (
    /\b(?:battery\s+life|long\s+battery|bater[ií]a\s+duradera|buena\s+bater[ií]a|dura\s+la\s+bater[ií]a)\b/i.test(
      text
    )
  ) {
    priorities.battery = 4;
  }

  // Hotspot priority
  if (/\b(?:need\s+(?:a\s+)?hotspot|use\s+(?:as\s+)?hotspot|necesito\s+punto\s+de\s+acceso)\b/i.test(text)) {
    priorities.hotspot = 4;
    usage.push("hotspot");
  }

  return { priorities, usage, accessibilityNeeds };
}

function extractCustomerStatus(text: string): "new" | "existing" | null {
  if (
    /\b(?:new\s+customer|switch(?:ing)?\s+to\s+t-mobile|new\s+to\s+t-mobile|cliente\s+nuevo|nuevo\s+cliente)\b/i.test(
      text
    )
  ) {
    return "new";
  }
  if (
    /\b(?:existing\s+customer|already\s+have\s+t-mobile|already\s+with\s+t-mobile|cliente\s+actual|ya\s+tengo\s+t-mobile)\b/i.test(
      text
    )
  ) {
    return "existing";
  }
  return null;
}

function extractPurchaseMode(text: string): "monthly" | "upfront" | null {
  if (
    /\b(?:monthly\s+payments?|pay\s+monthly|finance|plazos|mensualidades|pagar\s+mes\s+a\s+mes)\b/i.test(
      text
    )
  ) {
    return "monthly";
  }
  if (
    /\b(?:pay\s+(?:in\s+full|upfront)|buy\s+outright|pagar\s+de\s+golpe|pagar\s+al\s+contado|por\s+adelantado)\b/i.test(
      text
    )
  ) {
    return "upfront";
  }
  return null;
}

function extractEligibility(text: string): Eligibility | null {
  // CRITICAL REQUIREMENT:
  // "never infer eligibility from the user mentioning their parent's age without confirmation...
  // The extractor must respect an explicit distinction between unknown, not applicable, and no."
  // Only set 'yes' if the user explicitly confirms eligibility for the account holder.
  if (
    /\b(?:i\s+am\s+(?:over\s+55|55\s+or\s+older|55\+|6[0-9]|7[0-9]|8[0-9])|i\s+qualify\s+for\s+55\+|i'm\s+55\+)\b/i.test(
      text
    ) ||
    /\b(?:tengo\s+(?:m[aá]s\s+de\s+55|55\s+a[ñn]os\s+o\s+m[aá]s|6[0-9]\s+a[ñn]os|7[0-9]\s+a[ñn]os)|califico\s+para\s+55\+)\b/i.test(
      text
    )
  ) {
    return "yes";
  }

  if (
    /\b(?:not\s+55|under\s+55|not\s+eligible\s+for\s+senior|menor\s+de\s+55|no\s+tengo\s+55)\b/i.test(
      text
    )
  ) {
    return "no";
  }

  // If user says "my mom is 70", do NOT set age55Plus: 'yes'. Return null so it stays 'unknown'.
  return null;
}

