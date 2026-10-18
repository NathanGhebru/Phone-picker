import type { Language, Preferences } from "../shared/types";
import type {
  DetectedIntentType,
  EphemeralConversationState,
} from "./types";

export type PolicyAction =
  | { type: "ask_followup"; question: string; questionKey: string }
  | { type: "fetch_recommendations" }
  | { type: "explain_jargon"; term: string }
  | { type: "explain_recommendation" }
  | { type: "explain_cheaper" }
  | { type: "greet" }
  | { type: "clarify" };

export const MAX_FOLLOW_UP_QUESTIONS = 3;

/**
 * Evaluates conversational state and preferences to decide the next action.
 * Adheres strictly to the guidelines:
 * - Ask at most one question at a time.
 * - Maximum 2-4 targeted questions before recommending.
 * - Prioritize line count and whether budget includes device.
 * - Avoid technical questionnaires.
 */
export function decideNextAction(params: {
  preferences: Preferences;
  conversationState: EphemeralConversationState;
  intent: DetectedIntentType;
  termToExplain?: string | null;
  language: Language;
}): PolicyAction {
  const { preferences, conversationState, intent, termToExplain, language } = params;
  const isSpanish = language === "es";

  // Intent-driven actions take precedence when explicit
  if (intent === "explain_term" && termToExplain) {
    return { type: "explain_jargon", term: termToExplain };
  }

  if (intent === "explain_recommendation") {
    return { type: "explain_recommendation" };
  }

  if (intent === "cheaper_alternative") {
    return { type: "explain_cheaper" };
  }

  if (intent === "greeting") {
    return { type: "greet" };
  }

  // If question limit reached, proceed to recommend with available information
  if (conversationState.followUpQuestionsAsked >= MAX_FOLLOW_UP_QUESTIONS) {
    return { type: "fetch_recommendations" };
  }

  // Prioritize missing high-consequence requirements:
  // 1. Line count (cannot compare plans reliably without line count)
  if (preferences.lines === null) {
    return {
      type: "ask_followup",
      questionKey: "lines",
      question: isSpanish
        ? "¿Cuántas líneas de teléfono necesita?"
        : "How many phone lines do you need?",
    };
  }

  // 2. Budget includes device: Do not claim a bundle fits until established
  if (
    preferences.budgetMonthlyTotal !== null &&
    preferences.budgetIncludesDevice === null
  ) {
    return {
      type: "ask_followup",
      questionKey: "budget_scope",
      question: isSpanish
        ? `¿Ese presupuesto mensual de $${preferences.budgetMonthlyTotal} incluye tanto el teléfono como el plan, o solo el plan?`
        : `Does that $${preferences.budgetMonthlyTotal} monthly budget include both the phone and the plan, or just the plan?`,
    };
  }

  // 3. If no budget at all was mentioned and no priorities/usage either, ask general budget
  if (
    preferences.budgetMonthlyTotal === null &&
    preferences.usage.length === 0 &&
    conversationState.followUpQuestionsAsked === 0
  ) {
    return {
      type: "ask_followup",
      questionKey: "budget_amount",
      question: isSpanish
        ? "¿Aproximadamente cuánto le gustaría gastar al mes en su teléfono y plan?"
        : "About how much would you like to spend each month on your phone and plan?",
    };
  }

  // If we have line count and either budget or usage/priorities, fetch recommendations!
  return { type: "fetch_recommendations" };
}

/**
 * Checks if a user's answer is a direct response to a pending follow-up question.
 */
export function resolvePendingFollowUpAnswer(
  text: string,
  lastQuestionKey?: string | null
): Partial<Preferences> | null {
  if (!lastQuestionKey) return null;
  const normalized = text.toLowerCase().trim();

  if (lastQuestionKey === "budget_scope") {
    if (
      /\b(?:both|phone\s+and\s+plan|including|includes|yes|s[ií]|ambos|tanto|incluyendo)\b/i.test(
        normalized
      )
    ) {
      return { budgetIncludesDevice: true };
    }
    if (
      /\b(?:just\s+(?:the\s+)?plan|plan\s+only|service\s+only|solo\s+el\s+plan|solo\s+servicio)\b/i.test(
        normalized
      )
    ) {
      return { budgetIncludesDevice: false };
    }
  }

  if (lastQuestionKey === "lines") {
    const wordNumbers: Record<string, number> = {
      one: 1,
      single: 1,
      two: 2,
      three: 3,
      four: 4,
      una: 1,
      uno: 1,
      dos: 2,
      tres: 3,
      cuatro: 4,
    };
    const digitMatch = /\b(\d{1,2})\b/.exec(normalized);
    if (digitMatch) {
      return { lines: parseInt(digitMatch[1], 10) };
    }
    for (const [w, n] of Object.entries(wordNumbers)) {
      if (new RegExp(`\\b${w}\\b`, "i").test(normalized)) {
        return { lines: n };
      }
    }
  }

  return null;
}

