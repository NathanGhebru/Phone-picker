"use client";

import React, { useEffect, useRef } from "react";
import type { Language } from "@/shared/types";
import { getTranslations } from "@/i18n";

export interface TranscriptEntry {
  id: string;
  speaker: "user" | "assistant";
  text: string;
  final?: boolean;
}

export interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  isListening?: boolean;
  isAssistantThinking?: boolean;
  language?: Language;
  className?: string;
  maxHeight?: string;
}

/**
 * Chronological conversation transcript.
 * Provides high-contrast, visually separated message bubbles for User vs Assistant.
 * Fully screen-reader compatible with aria-live updates.
 */
export function TranscriptPanel({
  entries,
  isListening = false,
  isAssistantThinking = false,
  language = "en",
  className = "",
  maxHeight = "max-h-[380px]",
}: TranscriptPanelProps) {
  const t = getTranslations(language);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [entries.length, isAssistantThinking]);

  return (
    <section
      aria-label={t.transcript.title}
      className={`flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span aria-hidden="true">💬</span>
          {t.transcript.title}
        </h2>
        <div className="flex items-center gap-2">
          {isListening && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/70 dark:text-amber-200">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse" />
              <span>{t.transcript.listeningBadge}</span>
            </span>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {entries.length === 1 ? "1 message" : `${entries.length} messages`}
          </span>
        </div>
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        className={`transcript-scroll mt-4 space-y-4 overflow-y-auto overflow-x-hidden pr-1.5 ${maxHeight}`}
      >
        {entries.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-6 text-center text-sm sm:text-base text-slate-600 dark:text-slate-300 border border-dashed border-slate-200 dark:border-slate-700/80">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 mb-3 text-xl font-bold">
              👋
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
              {language === "es" ? "Bienvenido a VoiceMatch" : "Welcome to VoiceMatch"}
            </p>
            <p className="text-sm leading-relaxed max-w-md mx-auto">{t.transcript.emptyState}</p>
          </div>
        ) : (
          entries.map((entry) => {
            const isUser = entry.speaker === "user";
            return (
              <div
                key={entry.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div
                    aria-hidden="true"
                    className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-teal-700 text-xs font-bold shadow-xs mt-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-xs text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? "bg-teal-700 text-white dark:bg-teal-600 rounded-tr-xs"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-xs"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isUser
                          ? "text-teal-200 dark:text-teal-100"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isUser ? t.transcript.userSpeaker : t.transcript.assistantSpeaker}
                    </span>
                    {!isUser && (
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded px-1.5 py-0.2 font-medium">
                        {language === "es" ? "Especialista" : "Specialist"}
                      </span>
                    )}
                    {!entry.final && (
                      <span className="text-[10px] bg-black/20 text-white rounded px-1.5 py-0.5 font-mono">
                        {t.transcript.listeningBadge}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{entry.text}</p>
                </div>
              </div>
            );
          })
        )}

        {/* Live indicator if assistant is consulting/reviewing options */}
        {isAssistantThinking && (
          <div className="flex items-start gap-2.5">
            <div
              aria-hidden="true"
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-teal-700 text-xs font-bold shadow-xs mt-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
              <span className="flex space-x-1" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-teal-600 motion-safe:animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-teal-600 motion-safe:animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-teal-600 motion-safe:animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="font-medium">{t.transcript.thinkingBadge}</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} tabIndex={-1} aria-hidden="true" />
      </div>
    </section>
  );
}
