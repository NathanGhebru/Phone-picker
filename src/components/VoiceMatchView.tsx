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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-teal-600 font-bold shadow-xs">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  {t.common.appName}
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
                  {language === "es" ? "Asesoría Personal" : "Personal Concierge"}
                </span>
              </div>
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
          {/* Left / Primary Column: Personal Mobile Specialist Consultation Card (5 cols on desktop) */}
          <section
            aria-labelledby="voice-advisor-heading"
            className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-slate-900 p-6 text-white shadow-xl dark:bg-slate-900 border border-slate-800 relative overflow-hidden"
          >
            {/* Soft decorative background glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-teal-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative">
              {/* Specialist Profile Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
                    </svg>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500" />
                  </div>
                  <div>
                    <h2 id="voice-advisor-heading" className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-1.5">
                      {language === "es" ? "Asesor Personal VoiceMatch" : "Voice Advisor"}
                    </h2>
                    <p className="text-xs text-teal-300 font-medium">
                      {language === "es" ? "Especialista en planes y teléfonos" : "Personal Mobile Specialist"}
                    </p>
                  </div>
                </div>

                <ConversationStatus
                  state={voiceState}
                  message={voiceMessage || error}
                  language={language}
                  onRetry={onRetry}
                />
              </div>

              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-200">
                {language === "es"
                  ? "Hable con su especialista con total tranquilidad. Cuéntenos quién usará el teléfono, su presupuesto aproximado y qué es lo más importante para usted."
                  : "Talk with your specialist just like in a store. Tell us who the phone is for, your monthly budget, and what matters most to you."}
              </p>

              {/* Central Large Tactile Microphone Control */}
              <div className="mt-7 mb-5 flex justify-center">
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

            {/* Quick Tips Styled as Natural Questions */}
            <div className="mt-3 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
              <p className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <span className="text-amber-400">💡</span>
                {language === "es" ? "Preguntas naturales que puede hacer:" : "Natural questions you can ask:"}
              </p>
              <ul className="space-y-1.5 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>
                    {language === "es"
                      ? '"Busco un teléfono para mi mamá con letra grande por $60 al mes"'
                      : '"I need a phone for my mom with large text under $60/month"'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>
                    {language === "es"
                      ? '"¿Hay alguna opción más barata?"'
                      : '"Can you make it cheaper?"'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>
                    {language === "es"
                      ? '"¿Qué significa hotspot?"'
                      : '"What does hotspot mean?"'}
                  </span>
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
            VoiceMatch · Personal Mobile & Plan Concierge
          </p>
          <p className="mt-1 max-w-2xl mx-auto leading-relaxed">
            {t.common.disclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}
