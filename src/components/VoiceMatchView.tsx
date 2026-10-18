"use client";

import React from "react";
import type { Language, Preferences, Recommendation, RecommendationResponse } from "@/shared/types";
import { getTranslations } from "@/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { VoiceControl, type VoiceState } from "./VoiceControl";
import { ConversationStatus } from "./ConversationStatus";
import { TranscriptPanel, type TranscriptEntry } from "./TranscriptPanel";
import { ChatInput } from "./ChatInput";
import { PreferenceSummary } from "./PreferenceSummary";
import { RecommendationResults } from "./RecommendationResults";

export interface VoiceMatchViewProps {
  language: Language;
  transcript: TranscriptEntry[];
  recommendations: RecommendationResponse | null;
  selectedRecommendationId: string | null;
  voiceState: VoiceState;
  onLanguageChange: (language: Language) => void;
  onSendMessage: (text: string) => void | Promise<void>;
  onStartMicrophone: () => void | Promise<void>;
  onStopMicrophone: () => void | Promise<void>;
  onSelectRecommendation: (recommendation: Recommendation) => void;
  // Optional enhanced properties
  preferences?: Preferences;
  onCorrectPreferences?: (patch: Partial<Preferences>) => void;
  voiceMessage?: string | null;
  isSubmitting?: boolean;
  isLoadingRecommendations?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Composite top-level view component for VoiceMatch.
 * Fulfills `VoiceMatchViewProps` contract defined in component-contracts.ts.
 * Organizes responsive, high-contrast, bilingual layout with skip-links and full accessibility.
 */
export function VoiceMatchView({
  language,
  transcript,
  recommendations,
  selectedRecommendationId,
  voiceState,
  onLanguageChange,
  onSendMessage,
  onStartMicrophone,
  onStopMicrophone,
  onSelectRecommendation,
  preferences,
  onCorrectPreferences,
  voiceMessage,
  isSubmitting = false,
  isLoadingRecommendations = false,
  error = null,
  onRetry,
  className = "",
}: VoiceMatchViewProps) {
  const t = getTranslations(language);

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${className}`}>
      {/* Skip to Main Content Link for screen readers and keyboard users */}
      <a
        href="#main-shopping-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-4 focus:ring-teal-300"
      >
        {language === "es" ? "Saltar al contenido principal" : "Skip to main content"}
      </a>

      {/* Accessible Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-2xl">📱</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {t.common.appName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {t.common.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle
              currentLanguage={language}
              onLanguageChange={onLanguageChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-shopping-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Top Section: Split between Voice Advisor Card & Transcript Area on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Primary Column: Voice Control & Status Hero (5 cols on desktop) */}
          <section
            aria-labelledby="voice-advisor-heading"
            className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-slate-900 p-6 text-white shadow-xl dark:bg-slate-900 border border-slate-800"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 id="voice-advisor-heading" className="text-lg font-bold text-slate-100">
                  {language === "es" ? "Asistente de Voz" : "Voice Advisor"}
                </h2>
                <ConversationStatus
                  state={voiceState}
                  message={voiceMessage || error}
                  language={language}
                  onRetry={onRetry}
                />
              </div>

              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
                {language === "es"
                  ? "Describa lo que necesita con sus propias palabras. Cuéntenos quién usará el teléfono, su presupuesto aproximado y qué es lo más importante."
                  : "Describe what you need in your own words. Tell us who the phone is for, your monthly budget, and what matters most."}
              </p>

              {/* Central Large Microphone Control */}
              <div className="mt-8 mb-6 flex justify-center">
                <VoiceControl
                  state={voiceState}
                  onStart={onStartMicrophone}
                  onStop={onStopMicrophone}
                  errorMessage={voiceMessage || error}
                  language={language}
                  onRetry={onRetry}
                />
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">
                {language === "es" ? "Ejemplos que puede decir:" : "Examples you can say:"}
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  {language === "es"
                    ? '"Busco un teléfono para mi mamá con letra grande por $60 al mes"'
                    : '"I need a phone for my mom with large text under $60/month"'}
                </li>
                <li>
                  {language === "es"
                    ? '"¿Hay alguna opción más barata?"'
                    : '"Can you make it cheaper?"'}
                </li>
                <li>
                  {language === "es"
                    ? '"¿Qué significa hotspot?"'
                    : '"What does hotspot mean?"'}
                </li>
              </ul>
            </div>
          </section>

          {/* Right Column: Transcript & Typed Chat Fallback (7 cols on desktop) */}
          <section className="lg:col-span-7 space-y-4">
            <TranscriptPanel
              entries={transcript}
              isListening={voiceState === "listening"}
              isAssistantThinking={isSubmitting || voiceState === "connecting"}
              language={language}
              maxHeight="max-h-[340px]"
            />

            {/* Always-visible Chat Input */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <ChatInput
                onSubmit={onSendMessage}
                disabled={isSubmitting}
                language={language}
              />
            </div>
          </section>
        </div>

        {/* Middle Section: Recognized Preferences Summary (if preferences provided) */}
        {preferences && (
          <PreferenceSummary
            preferences={preferences}
            language={language}
            onCorrect={onCorrectPreferences}
          />
        )}

        {/* Bottom Section: Recommendation Results (Best Match, Lowest Cost, Alternative) */}
        <RecommendationResults
          data={recommendations}
          isLoading={isLoadingRecommendations}
          error={error}
          selectedId={selectedRecommendationId}
          onSelectRecommendation={onSelectRecommendation}
          language={language}
          onRetry={onRetry}
        />
      </main>

      {/* Accessible Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            VoiceMatch · Accessible Bilingual Phone & Plan Matcher
          </p>
          <p className="mt-1 max-w-2xl mx-auto leading-relaxed">
            {t.common.disclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}
