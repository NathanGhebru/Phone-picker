import type {
  Language,
  Recommendation,
} from "../shared/types";

export interface TermExplanation {
  term: string;
  en: string;
  es: string;
}

export const TERMINOLOGY_DICTIONARY: Record<string, { en: string; es: string }> = {
  hotspot: {
    en: "A mobile hotspot lets your phone share its cellular internet with other devices, like a laptop or tablet, creating your own portable Wi-Fi connection.",
    es: "Un punto de acceso móvil permite que su teléfono comparta su internet móvil con otros dispositivos, como una computadora o tableta, creando su propia red Wi-Fi portátil.",
  },
  mobile_data: {
    en: "Mobile data is the wireless internet your phone uses to browse websites, watch YouTube, or use apps when you are away from home Wi-Fi.",
    es: "Los datos móviles son el internet inalámbrico que usa su teléfono para navegar, ver YouTube o usar aplicaciones cuando no está conectado a una red Wi-Fi casera.",
  },
  "5G": {
    en: "5G is the current generation of mobile network technology, providing faster internet speeds and smoother video playback.",
    es: "5G es la generación actual de redes móviles, que ofrece velocidades de internet más rápidas y una reproducción de video más fluida.",
  },
  autopay: {
    en: "AutoPay automatically pays your monthly bill from a debit card or bank account each month, which often provides a discount of $5 per line.",
    es: "El pago automático descuenta su factura mensual de una tarjeta de débito o cuenta bancaria, lo que suele ofrecer un descuento de $5 por línea.",
  },
  financing: {
    en: "Phone financing divides the cost of a new phone into 24 monthly installments on your bill instead of paying the entire price today.",
    es: "El financiamiento divide el costo de un teléfono nuevo en 24 pagos mensuales en su factura en lugar de pagar el precio total hoy mismo.",
  },
};

export const REASON_CODE_DICTIONARY: Record<string, { en: string; es: string }> = {
  // Authoritative codes from Person 3 recommendation engine (src/recommendations/explanations.ts)
  WITHIN_CONFIRMED_COMBINED_BUDGET: {
    en: "Fits comfortably within your confirmed combined monthly budget",
    es: "Se ajusta cómodamente a su presupuesto mensual combinado confirmado",
  },
  HIGH_READABILITY_HEURISTIC: {
    en: "Features a high-readability screen with sharp text and clear contrast",
    es: "Cuenta con una pantalla de alta legibilidad con texto nítido y buen contraste",
  },
  STRONG_BATTERY_HEURISTIC: {
    en: "Offers a long-lasting battery designed for dependable all-day use",
    es: "Ofrece una batería de larga duración diseñada para un uso confiable todo el día",
  },
  STRONG_CAMERA_HEURISTIC: {
    en: "Equipped with a high-quality camera for clear photos and video calls",
    es: "Equipado con una cámara de alta calidad para fotos claras y videollamadas",
  },
  SIMPLE_USE_HEURISTIC: {
    en: "Straightforward and simple interface that is easy to navigate",
    es: "Interfaz sencilla y directa que resulta fácil de navegar",
  },
  SUPPORTS_HIGHER_USAGE_HEURISTIC: {
    en: "Includes dedicated support and high-speed data for streaming or mobile hotspot",
    es: "Incluye soporte y datos de alta velocidad para transmisión de video o punto de acceso móvil",
  },
  ELIGIBLE_VERIFIED_PRICE_OPTION: {
    en: "Verified eligible combination that meets your base requirements at a confirmed price",
    es: "Combinación elegible y verificada que cumple con sus requisitos a un precio confirmado",
  },

  // Fixture / Contract convenience codes
  budget_fit: {
    en: "Fits comfortably within your specified monthly budget",
    es: "Se ajusta cómodamente al presupuesto mensual indicado",
  },
  large_display: {
    en: "Large, readable display that makes text and apps easy to see",
    es: "Pantalla grande y legible que facilita ver textos y aplicaciones",
  },
  long_battery: {
    en: "Long-lasting battery designed for all-day use without frequent recharging",
    es: "Batería duradera diseñada para todo el día sin necesidad de recargar constantemente",
  },
  simplicity: {
    en: "Straightforward and easy to use without complicated controls",
    es: "Sencillo y fácil de usar, sin controles complicados",
  },
  simple_ui: {
    en: "Clean, accessible interface designed for everyday tasks",
    es: "Interfaz limpia y accesible diseñada para tareas cotidianas",
  },
  streaming_data: {
    en: "Includes ample high-speed data for video streaming like YouTube",
    es: "Incluye abundantes datos de alta velocidad para ver videos en YouTube",
  },
  good_camera: {
    en: "Reliable camera for high-quality photos and video calls with family",
    es: "Cámara confiable para fotos de alta calidad y videollamadas familiares",
  },
  unlimited_talk_text: {
    en: "Includes unlimited calls and text messages",
    es: "Incluye llamadas y mensajes de texto ilimitados",
  },
  lowest_monthly_cost: {
    en: "The lowest monthly price among all eligible options",
    es: "El precio mensual más bajo entre todas las opciones elegibles",
  },
  age55_discount: {
    en: "Takes advantage of eligible 55+ plan savings",
    es: "Aprovecha los descuentos para mayores de 55 años elegibles",
  },
};

export const TRADEOFF_CODE_DICTIONARY: Record<string, { en: string; es: string }> = {
  // Authoritative codes from Person 3 recommendation engine (src/recommendations/explanations.ts)
  ACCESSIBILITY_COMPATIBILITY_UNVERIFIED: {
    en: "Accessibility and large-text compatibility features have not been officially verified for this device",
    es: "Las funciones de accesibilidad y texto grande no han sido verificadas oficialmente para este dispositivo",
  },
  DEVICE_MONTHLY_PRICE_UNAVAILABLE: {
    en: "A monthly device installment price is not currently available for this phone",
    es: "El precio mensual a plazos del dispositivo no está disponible actualmente para este teléfono",
  },
  DEVICE_FINANCING_ESTIMATE_EXCLUDES_TAXES_FEES_CREDITS: {
    en: "Device financing is an estimate and excludes applicable taxes, fees, and promotional credits",
    es: "El financiamiento del dispositivo es estimado y excluye impuestos, cargos y créditos promocionales",
  },
  TAXES_AND_FEES_EXCLUDED_FROM_MONTHLY_ESTIMATE: {
    en: "Estimated monthly price excludes regulatory fees and local taxes",
    es: "El precio mensual estimado no incluye cargos regulatorios ni impuestos locales",
  },
  LOWER_CAMERA_HEURISTIC: {
    en: "Basic camera system suited for casual everyday photos rather than advanced photography",
    es: "Cámara básica adecuada para fotos cotidianas casuales pero no para fotografía avanzada",
  },

  // Fixture / Contract convenience codes
  higher_device_cost: {
    en: "Device monthly cost is higher than other alternatives",
    es: "El costo mensual del dispositivo es más alto que otras alternativas",
  },
  smaller_display: {
    en: "More compact screen, which may make small text harder to read",
    es: "Pantalla más compacta, lo que podría dificultar la lectura de textos pequeños",
  },
  entry_level_camera: {
    en: "Basic camera suited for simple snapshots rather than advanced photography",
    es: "Cámara básica adecuada para fotos sencillas pero no para fotografía avanzada",
  },
  data_throttling: {
    en: "Data speeds may slow during peak congestion after heavy usage",
    es: "La velocidad de datos puede reducirse durante congestión tras un uso intenso",
  },
  requires_autopay: {
    en: "Quoted price requires AutoPay enrollment",
    es: "El precio cotizado requiere inscripción en pago automático",
  },
  financing_commitment: {
    en: "Requires a 24-month financing agreement for the device installment",
    es: "Requiere un acuerdo de financiamiento de 24 meses para el pago a plazos del dispositivo",
  },
  no_hotspot: {
    en: "Does not include high-speed mobile hotspot data",
    es: "No incluye datos de punto de acceso móvil de alta velocidad",
  },
};

export function explainTerm(termKey: string, language: Language = "en"): string {
  const normalizedKey = termKey.toLowerCase().replace(/[\s-]/g, "_");
  const entry = TERMINOLOGY_DICTIONARY[termKey] || TERMINOLOGY_DICTIONARY[normalizedKey];
  if (entry) {
    return entry[language] || entry.en;
  }

  // Fallback if unknown jargon term
  if (language === "es") {
    return `No tengo una definición registrada para "${termKey}" en este momento, pero puedo ayudarle a buscar el teléfono o plan ideal.`;
  }
  return `I don't have a definition on file for "${termKey}" right now, but I can help you find the right phone and plan.`;
}

export function translateReasonCode(code: string, language: Language = "en"): string {
  const match = REASON_CODE_DICTIONARY[code];
  if (match) {
    return match[language] || match.en;
  }
  // Explicitly report unknown codes per Person 3 contract
  if (language === "es") {
    return `Código de motivo '${code}' (definición pendiente del catálogo)`;
  }
  return `Reason code '${code}' (definition pending catalog dictionary)`;
}

export function translateTradeoffCode(code: string, language: Language = "en"): string {
  const match = TRADEOFF_CODE_DICTIONARY[code];
  if (match) {
    return match[language] || match.en;
  }
  if (language === "es") {
    return `Compromiso '${code}' (definición pendiente del catálogo)`;
  }
  return `Tradeoff code '${code}' (definition pending catalog dictionary)`;
}

export function explainRecommendation(
  rec: Recommendation,
  language: Language = "en"
): string {
  const isSpanish = language === "es";

  const reasons = (rec.reasons || []).map((code) => translateReasonCode(code, language));
  const tradeoffs = (rec.tradeoffs || []).map((code) => translateTradeoffCode(code, language));

  const reasonsText =
    reasons.length > 0
      ? reasons.join(isSpanish ? "; " : "; ")
      : isSpanish
      ? "Cumple con sus preferencias seleccionadas"
      : "Meets your specified preferences";

  const tradeoffsText =
    tradeoffs.length > 0
      ? (isSpanish ? " Tenga en cuenta: " : " Keep in mind: ") + tradeoffs.join("; ") + "."
      : "";

  const priceText =
    rec.estimatedMonthlyTotal !== null
      ? isSpanish
        ? ` por un estimado de $${rec.estimatedMonthlyTotal}/mes`
        : ` for an estimated $${rec.estimatedMonthlyTotal}/month`
      : "";

  if (isSpanish) {
    return `Recomiendo esta combinación (${rec.phoneId} con plan ${rec.planId})${priceText} porque: ${reasonsText}.${tradeoffsText}`;
  }

  return `I recommend this combination (${rec.phoneId} with ${rec.planId})${priceText} because: ${reasonsText}.${tradeoffsText}`;
}

export function explainCheaperAlternative(
  recommendations: Recommendation[],
  selectedId: string | null = null,
  language: Language = "en"
): {
  foundCheaper: boolean;
  cheaperRecommendation: Recommendation | null;
  text: string;
} {
  const isSpanish = language === "es";

  if (!recommendations || recommendations.length === 0) {
    return {
      foundCheaper: false,
      cheaperRecommendation: null,
      text: isSpanish
        ? "No hay recomendaciones activas para comparar en este momento."
        : "There are no active recommendations available to compare right now.",
    };
  }

  // Find the currently viewed recommendation
  const current = selectedId
    ? recommendations.find((r) => r.id === selectedId) || recommendations[0]
    : recommendations[0];

  const currentPrice = current.estimatedMonthlyTotal ?? Infinity;

  // Search for an option that is strictly cheaper
  const strictlyCheaper = recommendations.filter(
    (r) =>
      r.id !== current.id &&
      r.estimatedMonthlyTotal !== null &&
      r.estimatedMonthlyTotal < currentPrice
  );

  // Or check if there is an option marked 'lowest_cost' that is cheaper
  strictlyCheaper.sort(
    (a, b) => (a.estimatedMonthlyTotal ?? Infinity) - (b.estimatedMonthlyTotal ?? Infinity)
  );

  const bestCheaper = strictlyCheaper[0] || null;

  if (bestCheaper && bestCheaper.estimatedMonthlyTotal !== null) {
    const tradeoffs = (bestCheaper.tradeoffs || []).map((c) =>
      translateTradeoffCode(c, language)
    );
    const tradeoffNote =
      tradeoffs.length > 0
        ? isSpanish
          ? ` A cambio: ${tradeoffs.join("; ")}.`
          : ` Note: ${tradeoffs.join("; ")}.`
        : "";

    const text = isSpanish
      ? `Una opción más económica es el ${bestCheaper.phoneId} con el plan ${bestCheaper.planId} por aproximadamente $${bestCheaper.estimatedMonthlyTotal}/mes (en lugar de $${current.estimatedMonthlyTotal}/mes).${tradeoffNote}`
      : `A cheaper option is the ${bestCheaper.phoneId} with the ${bestCheaper.planId} plan for approximately $${bestCheaper.estimatedMonthlyTotal}/month (compared to $${current.estimatedMonthlyTotal}/month).${tradeoffNote}`;

    return {
      foundCheaper: true,
      cheaperRecommendation: bestCheaper,
      text,
    };
  }

  // No strictly cheaper qualifying result exists among returned options
  const text = isSpanish
    ? `Las opciones mostradas ya son las combinaciones de menor costo que cumplen con sus requisitos (desde $${currentPrice === Infinity ? "0" : currentPrice}/mes). ¿Le gustaría fijar un presupuesto específico más bajo o ajustar alguna preferencia?`
    : `The options shown are already the lowest-cost combinations that satisfy your requirements (starting at $${currentPrice === Infinity ? "0" : currentPrice}/month). Would you like to specify a lower budget target or adjust your requirements?`;

  return {
    foundCheaper: false,
    cheaperRecommendation: null,
    text,
  };
}

