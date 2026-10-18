"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createInitialConversationState, createInitialPreferences, processTurn } from "@/agent";
import type { EphemeralConversationState } from "@/agent";
import { createElevenLabsVoiceAdapter, type ElevenLabsConversationSdk } from "@/voice/elevenlabs-adapter";
import { VoiceSessionController } from "@/voice/session-controller";
import type { VoiceController } from "@/voice/types";
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
  if (patch.budgetIncludesDevice !== undefined) {
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

/** Single state owner. Typed turns are serialized; voice remains transport-only until its agent has a verified action bridge. */
export function useVoiceMatchSession(defaultLanguage: Language = "en") {
  const stateRef = useRef<VoiceMatchSessionState>(initialState(defaultLanguage));
  const [state, setState] = useState<VoiceMatchSessionState>(stateRef.current);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const sequenceRef = useRef(0);
  const controllerRef = useRef<VoiceController | null>(null);
  const commit = useCallback((update: (value: VoiceMatchSessionState) => VoiceMatchSessionState) => {
    const next = update(stateRef.current); stateRef.current = next; setState(next); return next;
  }, []);
  const appendTranscript = useCallback((event: Extract<AppEvent, { type: "transcript" }>) => {
    commit((current) => {
      const text = event.text.trim(); if (!text) return current;
      if (event.final && current.transcript.some((entry) => entry.speaker === event.speaker && entry.final && entry.text === text)) return current;
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
  const setLanguage = useCallback((language: Language) => applyEvent({ type: "language_changed", language }), [applyEvent]);
  const submitMessage = useCallback((rawText: string) => {
    const text = rawText.trim(); if (!text) return Promise.resolve();
    // ChatInput is disabled while processing, and this ref closes the small
    // render gap before disabled reaches the DOM.
    if (pendingRef.current > 0) return Promise.resolve();
    appendTranscript({ type: "transcript", speaker: "user", text, final: true }); pendingRef.current += 1;
    commit((current) => ({ ...current, isSubmitting: true, error: null }));
    const turn = async () => {
      const current = stateRef.current;
      try {
        const result = await processTurn({ text, source: "text", language: current.language, preferences: current.preferences, recommendations: current.recommendations, selectedRecommendationId: current.selectedRecommendationId, conversationState: current.conversationState });
        // The engine intentionally converts recommendation-client failures to a
        // user-safe assistant reply. Mirror that real failure into the view's
        // error state; do not substitute fixtures or infer a recommendation.
        const recommendationFailure = /issue retrieving recommendations|problema al consultar las recomendaciones/i.test(result.assistantText);
        commit((latest) => ({ ...latest, language: result.preferences.language, preferences: result.preferences, recommendations: result.recommendations, selectedRecommendationId: result.selectedRecommendationId, conversationState: result.conversationState, error: recommendationFailure ? result.assistantText : null }));
        result.events.forEach(applyEvent);
      } catch (error) { commit((latest) => ({ ...latest, error: error instanceof Error ? error.message : "Something went wrong. Please try again." })); }
      finally { pendingRef.current -= 1; commit((latest) => ({ ...latest, isSubmitting: pendingRef.current > 0 })); }
    };
    queueRef.current = queueRef.current.then(turn, turn); return queueRef.current;
  }, [appendTranscript, applyEvent, commit]);
  const selectRecommendation = useCallback((id: string) => commit((current) => ({ ...current, selectedRecommendationId: id })), [commit]);
  const correctPreferences = useCallback((patch: Partial<Preferences>) => {
    const text = correctionMessage(patch, stateRef.current.language);
    return text ? submitMessage(text) : Promise.resolve();
  }, [submitMessage]);
  const startVoice = useCallback(async () => {
    try {
      if (!controllerRef.current) {
        const sdk = await import("@elevenlabs/client");
        controllerRef.current = new VoiceSessionController(createElevenLabsVoiceAdapter(sdk.Conversation as unknown as ElevenLabsConversationSdk));
        controllerRef.current.subscribe(applyEvent);
      }
      await controllerRef.current.start(stateRef.current.language);
    } catch (error) { commit((current) => ({ ...current, voiceState: "error", voiceMessage: error instanceof Error ? error.message : "Voice is unavailable. You can continue by typing." })); }
  }, [applyEvent, commit]);
  const stopVoice = useCallback(async () => { await controllerRef.current?.stop(); }, []);
  useEffect(() => () => { void controllerRef.current?.stop(); }, []);
  return { ...state, setLanguage, submitMessage, selectRecommendation, correctPreferences, startVoice, stopVoice, retry: () => submitMessage(stateRef.current.conversationState.lastUserUtterance ?? "") };
}
