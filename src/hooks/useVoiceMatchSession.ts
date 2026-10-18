"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createInitialConversationState, createInitialPreferences, processTurn } from "@/agent";
import type { EphemeralConversationState } from "@/agent";
import { createElevenLabsVoiceAdapter } from "@/voice/elevenlabs-adapter";
import { VoiceSessionController } from "@/voice/session-controller";
import type { VoiceClientTools, VoiceController } from "@/voice/types";
import type { AppEvent, Language, Preferences, RecommendationResponse } from "@/shared/types";

export type TranscriptEntry = { id: string; speaker: "user" | "assistant"; text: string; final: boolean };
export type VoiceMatchSessionState = {
  language: Language; preferences: Preferences; recommendations: RecommendationResponse | null;
  selectedRecommendationId: string | null; conversationState: EphemeralConversationState;
  transcript: TranscriptEntry[]; voiceState: Extract<AppEvent, { type: "listening_state" }>["state"];
  voiceMessage: string | null; isSubmitting: boolean; error: string | null;
};

function correctionMessage(patch: Partial<Preferences>, language: Language): string | null {
  const parts: string[] = [];
  if (patch.budgetMonthlyTotal !== undefined && patch.budgetMonthlyTotal !== null) {
    parts.push(language === "es" ? `el presupuesto es $${patch.budgetMonthlyTotal}` : `the budget is $${patch.budgetMonthlyTotal}`);
  }
  if (patch.lines !== undefined && patch.lines !== null) {
    parts.push(language === "es" ? `${patch.lines} l\u00edneas` : `${patch.lines} lines`);
  }
  if (patch.budgetIncludesDevice !== undefined && patch.budgetIncludesDevice !== null) {
    parts.push(patch.budgetIncludesDevice
      ? language === "es" ? "incluyendo el tel\u00e9fono" : "including the phone"
      : language === "es" ? "solo para el plan" : "plan only");
  }
  if (parts.length === 0) return null;
  return language === "es" ? `En realidad, ${parts.join(", ")}.` : `Actually, ${parts.join(", ")}.`;
}

const initialState = (language: Language): VoiceMatchSessionState => ({
  language, preferences: createInitialPreferences(language), recommendations: null, selectedRecommendationId: null,
  conversationState: createInitialConversationState(), transcript: [], voiceState: "idle", voiceMessage: null,
  isSubmitting: false, error: null,
});

async function createBrowserVoiceController(): Promise<VoiceController> {
  const { Conversation } = await import("@elevenlabs/client");
  return new VoiceSessionController(createElevenLabsVoiceAdapter(Conversation));
}

/** Dependencies allow integration tests to exercise the real hook without microphone hardware. */
export interface VoiceMatchSessionDependencies {
  createVoiceController?: () => Promise<VoiceController>;
  processTurn?: typeof processTurn;
}

const failureText = (language: Language) => language === "es"
  ? "No pude completar la solicitud. Puede intentarlo de nuevo o escribirla."
  : "I couldn't complete that request. Please try again or type it.";
const endedText = (language: Language) => language === "es"
  ? "La sesión terminó. Inicie el micrófono de nuevo para continuar."
  : "The session has ended. Start the microphone again to continue.";

/** One state owner and one serialized processTurn path for typed input and voice tools. */
export function useVoiceMatchSession(
  defaultLanguage: Language = "en",
  dependencies: VoiceMatchSessionDependencies = {},
) {
  const createController = dependencies.createVoiceController ?? createBrowserVoiceController;
  const process = dependencies.processTurn ?? processTurn;
  const [state, setState] = useState<VoiceMatchSessionState>(() => initialState(defaultLanguage));
  const stateRef = useRef<VoiceMatchSessionState>(state);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const sequenceRef = useRef(0);
  const controllerRef = useRef<VoiceController | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const voiceGenerationRef = useRef(0);
  const revisionRef = useRef(0);
  const mountedRef = useRef(true);
  const commit = useCallback((update: (value: VoiceMatchSessionState) => VoiceMatchSessionState) => {
    if (!mountedRef.current) return stateRef.current;
    const next = update(stateRef.current); stateRef.current = next; setState(next); return next;
  }, []);
  const appendTranscript = useCallback((event: Extract<AppEvent, { type: "transcript" }>) => {
    commit((current) => {
      const text = event.text.trim(); if (!text) return current;
      const last = current.transcript.at(-1);
      if (event.final && last?.speaker === event.speaker && last.final && last.text === text) return current;
      const interimIndex = current.transcript.findIndex((entry) => entry.speaker === event.speaker && !entry.final);
      const transcript = [...current.transcript];
      if (interimIndex >= 0) transcript[interimIndex] = { ...transcript[interimIndex], text, final: event.final || transcript[interimIndex].final };
      else transcript.push({ id: `turn-${++sequenceRef.current}`, speaker: event.speaker, text, final: event.final });
      return { ...current, transcript };
    });
  }, [commit]);
  const applyEvent = useCallback((event: AppEvent) => {
    if (event.type === "transcript") { appendTranscript(event); return; }
    commit((current) => {
      if (event.type === "listening_state") return { ...current, voiceState: event.state, voiceMessage: event.message ?? null };
      if (event.type === "preferences_updated") return { ...current, preferences: event.preferences, language: event.preferences.language };
      if (event.type === "recommendations_updated") return { ...current, recommendations: event.data };
      return { ...current, language: event.language, preferences: { ...current.preferences, language: event.language } };
    });
  }, [appendTranscript, commit]);

  const runTurn = useCallback((text: string, source: "voice" | "text", generation?: number): Promise<string> => {
    const language = stateRef.current.language;
    const revision = revisionRef.current;
    const isCurrent = () => mountedRef.current && revision === revisionRef.current
      && (source === "text" || generation === voiceGenerationRef.current);
    if (!isCurrent()) return Promise.resolve(endedText(language));
    if (source === "text") appendTranscript({ type: "transcript", speaker: "user", text, final: true });
    pendingRef.current += 1;
    commit((current) => ({ ...current, isSubmitting: true, error: null }));
    const turn = async (): Promise<string> => {
      try {
        if (!isCurrent()) return endedText(language);
        const current = stateRef.current;
        const result = await process({ text, source, language: current.language, preferences: current.preferences, recommendations: current.recommendations, selectedRecommendationId: current.selectedRecommendationId, conversationState: current.conversationState, isFinal: true });
        if (!isCurrent()) return endedText(language);
        // The engine intentionally converts recommendation-client failures to a
        // user-safe assistant reply. Mirror that real failure into the view's
        // error state; do not substitute fixtures or infer a recommendation.
        const recommendationFailure = /issue retrieving recommendations|problema al consultar las recomendaciones/i.test(result.assistantText);
        commit((latest) => ({ ...latest, language: result.preferences.language, preferences: result.preferences, recommendations: result.recommendations, selectedRecommendationId: result.selectedRecommendationId, conversationState: result.conversationState, error: recommendationFailure ? result.assistantText : null }));
        for (const event of result.events) {
          // SDK messages describe actual speech. A tool result is not an extra spoken turn.
          if (source === "voice" && event.type === "transcript") continue;
          applyEvent(event);
        }
        return result.assistantText || failureText(language);
      } catch {
        if (!isCurrent()) return endedText(language);
        const message = failureText(language);
        commit((latest) => ({ ...latest, error: message }));
        return message;
      }
      finally { pendingRef.current -= 1; commit((latest) => ({ ...latest, isSubmitting: pendingRef.current > 0 })); }
    };
    const result = queueRef.current.then(turn, turn);
    queueRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, [appendTranscript, applyEvent, commit, process]);

  const submitMessage = useCallback((rawText: string): Promise<void> => {
    const text = rawText.trim();
    // Preserve the typed UI's double-submit protection. Voice corrections queue in order.
    if (!text || pendingRef.current > 0) return Promise.resolve();
    return runTurn(text, "text").then(() => undefined);
  }, [runTurn]);
  const selectRecommendation = useCallback((id: string) => commit((current) => ({ ...current, selectedRecommendationId: id })), [commit]);
  const correctPreferences = useCallback((patch: Partial<Preferences>) => {
    const text = correctionMessage(patch, stateRef.current.language);
    return text ? submitMessage(text) : Promise.resolve();
  }, [submitMessage]);
  const stopVoice = useCallback(async () => {
    ++voiceGenerationRef.current;
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    const controller = controllerRef.current;
    controllerRef.current = null;
    commit((current) => ({ ...current, voiceState: "idle", voiceMessage: null }));
    await controller?.stop();
  }, [commit]);

  const setLanguage = useCallback((language: Language) => {
    if (language === stateRef.current.language) return;
    ++revisionRef.current;
    // Language selection chooses a different authorized agent on the next start.
    void stopVoice();
    applyEvent({ type: "language_changed", language });
  }, [applyEvent, stopVoice]);

  const startVoice = useCallback(async () => {
    if (!mountedRef.current || ["connecting", "listening", "speaking"].includes(stateRef.current.voiceState)) return;
    const language = stateRef.current.language;
    const generation = ++voiceGenerationRef.current;
    const isCurrent = () => mountedRef.current && generation === voiceGenerationRef.current;
    commit((current) => ({ ...current, voiceState: "connecting", voiceMessage: null }));
    try {
      const controller = await createController();
      if (!isCurrent()) { await controller.stop(); return; }
      controllerRef.current = controller;
      unsubscribeRef.current = controller.subscribe((event) => {
        if (!isCurrent()) return;
        applyEvent(event);
        if (event.type === "listening_state" && (event.state === "idle" || event.state === "error")) {
          ++voiceGenerationRef.current;
          unsubscribeRef.current?.();
          unsubscribeRef.current = null;
          controllerRef.current = null;
          void controller.stop();
        }
      });
      const clientTools: VoiceClientTools = {
        process_voice_turn: async (parameters) => {
          if (!isCurrent()) return endedText(language);
          if (!parameters || Array.isArray(parameters) || typeof parameters !== "object"
            || Object.keys(parameters).length !== 1 || typeof parameters.text !== "string"
            || !parameters.text.trim() || parameters.text.length > 4_000) {
            return language === "es"
              ? "No recibí una solicitud completa. Repita lo que necesita, por favor."
              : "I didn't receive a complete request. Please repeat what you need.";
          }
          return runTurn(parameters.text.trim(), "voice", generation);
        },
      };
      // Transcripts stay observational. This blocking tool is the only voice action path.
      await controller.start(language, { clientTools });
    } catch {
      if (isCurrent()) {
        await stopVoice();
        commit((current) => ({ ...current, voiceState: "error", voiceMessage: failureText(language) }));
      }
    }
  }, [applyEvent, commit, createController, runTurn, stopVoice]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void stopVoice();
    };
  }, [stopVoice]);
  return { ...state, setLanguage, submitMessage, selectRecommendation, correctPreferences, startVoice, stopVoice, retry: () => submitMessage(stateRef.current.conversationState.lastUserUtterance ?? "") };
}
