import type {
  AppEvent,
  Language,
  Preferences,
  PreferenceUpdate,
  RecommendationResponse,
} from "../shared/types";
import {
  decideNextAction,
  resolvePendingFollowUpAnswer,
} from "./conversation-policy";
import {
  explainCheaperAlternative,
  explainRecommendation,
  explainTerm,
} from "./explanations";
import {
  extractFromUtterance,
} from "./preference-extractor";
import {
  createPreferenceUpdate,
  mergePreferences,
} from "./preference-state";
import {
  RecommendationClient,
} from "./recommendation-client";
import type {
  EphemeralConversationState,
  ProcessTurnParams,
  ProcessTurnResult,
} from "./types";

export function createInitialConversationState(): EphemeralConversationState {
  return {
    turnCount: 0,
    followUpQuestionsAsked: 0,
    lastQuestionAsked: null,
    lastIntent: null,
    lastUserUtterance: null,
    history: [],
    unansweredQuestions: [],
  };
}

export class ConversationEngine {
  private recommendationClient: RecommendationClient;

  constructor(client?: RecommendationClient) {
    this.recommendationClient = client ?? new RecommendationClient();
  }

  /**
   * Main turn processing function for VoiceMatch.
   * Processes both confirmed voice transcripts and typed chat messages through
   * the exact same validation, policy, and recommendation pipeline.
   */
  async processTurn(params: ProcessTurnParams): Promise<ProcessTurnResult> {
    const {
      text,
      source,
      language: inputLanguage,
      preferences: currentPrefs,
      recommendations: existingRecs = null,
      selectedRecommendationId: inputSelectedId = null,
      conversationState: inputState = null,
      isFinal = true,
    } = params;

    const language: Language = inputLanguage || currentPrefs.language || "en";
    const state: EphemeralConversationState = inputState
      ? {
          ...inputState,
          history: [...inputState.history],
          unansweredQuestions: [...inputState.unansweredQuestions],
        }
      : createInitialConversationState();

    // Acceptance Test 7: Unconfirmed hypotheses (isFinal === false) must not mutate preferences
    if (isFinal === false) {
      return {
        assistantText: "",
        preferences: currentPrefs,
        preferenceUpdate: null,
        recommendations: existingRecs ?? null,
        selectedRecommendationId: inputSelectedId ?? null,
        conversationState: state,
        events: [],
      };
    }

    const events: AppEvent[] = [];
    let updatedPrefs: Preferences = { ...currentPrefs };
    let latestUpdate: PreferenceUpdate | null = null;
    let assistantText = "";
    let activeRecs: RecommendationResponse | null = existingRecs ?? null;
    let selectedId: string | null = inputSelectedId ?? null;

    // Check if the user is answering a pending follow-up question
    const pendingAnswerPatch = resolvePendingFollowUpAnswer(
      text,
      state.lastQuestionAsked
    );

    // Extract entities, intents, and preference patches
    const extraction = extractFromUtterance(text, language);
    let patch = extraction.patch;

    // If answering a pending follow-up question, combine it
    if (pendingAnswerPatch) {
      patch = { ...pendingAnswerPatch, ...patch };
    }
    if (language !== currentPrefs.language) patch = { ...patch, language };

    // Apply preference patch if any fields were identified
    if (Object.keys(patch).length > 0) {
      latestUpdate = createPreferenceUpdate(patch, source, text);
      updatedPrefs = mergePreferences(updatedPrefs, latestUpdate);
      events.push({
        type: "preferences_updated",
        preferences: updatedPrefs,
      });
    }

    // Evaluate conversation policy
    const policyAction = decideNextAction({
      preferences: updatedPrefs,
      conversationState: state,
      intent: extraction.intent,
      termToExplain: extraction.entities.termToExplain,
      language,
    });

    switch (policyAction.type) {
      case "explain_jargon": {
        // Acceptance Test 13: Jargon explanation preserves preferences and existing context
        assistantText = explainTerm(policyAction.term, language);
        state.lastIntent = "explain_term";
        state.lastQuestionAsked = null;
        break;
      }

      case "explain_recommendation": {
        // Acceptance Test 12: Grounded explanation using real recommendation reason codes
        state.lastIntent = "explain_recommendation";
        state.lastQuestionAsked = null;

        const currentRecList = activeRecs?.recommendations ?? [];
        if (currentRecList.length > 0) {
          const recToExplain = selectedId
            ? currentRecList.find((r) => r.id === selectedId) || currentRecList[0]
            : currentRecList[0];
          assistantText = explainRecommendation(recToExplain, language);
        } else {
          assistantText =
            language === "es"
              ? "Aún no tenemos recomendaciones activas para explicar. ¿Le gustaría que le recomiende opciones según su presupuesto?"
              : "We don't have active recommendations to explain yet. Would you like me to find options based on your budget?";
        }
        break;
      }

      case "explain_cheaper": {
        // Acceptance Test 11: Cheaper alternative without fabricating prices
        state.lastIntent = "cheaper_alternative";
        state.lastQuestionAsked = null;

        const currentRecList = activeRecs?.recommendations ?? [];
        const cheaperResult = explainCheaperAlternative(
          currentRecList,
          selectedId,
          language
        );

        assistantText = cheaperResult.text;
        if (cheaperResult.foundCheaper && cheaperResult.cheaperRecommendation) {
          selectedId = cheaperResult.cheaperRecommendation.id;
        }
        break;
      }

      case "greet": {
        state.lastIntent = "greeting";
        state.lastQuestionAsked = null;
        assistantText =
          language === "es"
            ? "¡Hola! Cuénteme qué teléfono o plan está buscando para el día a día."
            : "Hello! Tell me about the phone or plan you're looking for in your everyday life.";
        break;
      }

      case "ask_followup": {
        state.lastIntent = "preference_statement";
        state.followUpQuestionsAsked += 1;
        state.lastQuestionAsked = policyAction.questionKey;
        assistantText = policyAction.question;
        break;
      }

      case "fetch_recommendations": {
        state.lastIntent = extraction.intent;
        state.lastQuestionAsked = null;

        try {
          const recResponse = await this.recommendationClient.getRecommendations(
            updatedPrefs
          );
          activeRecs = recResponse;
          events.push({
            type: "recommendations_updated",
            data: recResponse,
          });

          if (recResponse.recommendations.length > 0) {
            const topRec = recResponse.recommendations[0];
            selectedId = topRec.id;
            const introduction = language === "es"
              ? `He encontrado ${recResponse.recommendations.length} opciones del catálogo. `
              : `I found ${recResponse.recommendations.length} catalog options. `;
            assistantText = introduction + explainRecommendation(topRec, language);
            if (updatedPrefs.budgetIncludesDevice === false) {
              assistantText += language === "es"
                ? " Su presupuesto se aplica solo al plan; el teléfono se paga aparte."
                : " Your budget applies to the plan only; the phone costs extra.";
            }
          } else {
            // Acceptance Test 9: Empty recommendations honest explanation
            selectedId = null;
            assistantText =
              language === "es"
                ? "No encontramos opciones verificadas en el catálogo que cumplan con todos sus requisitos y presupuesto. ¿Le gustaría ajustar su presupuesto mensual o preferencias?"
                : "No verified catalog options match all your requirements and budget. Would you like to adjust your monthly budget or preferences?";
          }
        } catch {
          // Acceptance Test 15: Safe handling of API errors
          // Previous results are not verified for this turn's updated preferences.
          activeRecs = null;
          selectedId = null;
          assistantText =
            language === "es"
              ? "Disculpe, ocurrió un problema al consultar las recomendaciones. No puedo confirmar opciones ni precios ahora. Sus preferencias están guardadas; puede pedir que lo intente de nuevo."
              : "Sorry, there was an issue retrieving recommendations. I cannot confirm options or prices right now. Your preferences are saved; you can ask me to try again.";
        }
        break;
      }

      default: {
        assistantText =
          language === "es"
            ? "Entendido. ¿Desea que busquemos recomendaciones o tiene alguna pregunta adicional?"
            : "Understood. Would you like me to look for recommendations or do you have any questions?";
      }
    }

    // Add assistant transcript event
    events.push({
      type: "transcript",
      speaker: "assistant",
      text: assistantText,
      final: true,
    });

    // Update conversation state history
    state.turnCount += 1;
    state.lastUserUtterance = text;
    state.history.push({ speaker: "user", text, timestamp: Date.now() });
    state.history.push({ speaker: "assistant", text: assistantText, timestamp: Date.now() });

    return {
      assistantText,
      preferences: updatedPrefs,
      preferenceUpdate: latestUpdate,
      recommendations: activeRecs,
      selectedRecommendationId: selectedId,
      conversationState: state,
      events,
    };
  }
}

// Singleton convenience export for Person 1 / Codex
export const conversationEngine = new ConversationEngine();

export async function processTurn(params: ProcessTurnParams): Promise<ProcessTurnResult> {
  return conversationEngine.processTurn(params);
}
