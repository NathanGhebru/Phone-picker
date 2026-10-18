"use client";

import React from "react";
import type { Language } from "@/shared/types";
import { getTranslations } from "@/i18n";

export type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "error";

export interface VoiceControlProps {
  state: VoiceState;
  onStart: () => void | Promise<void>;
  onStop: () => void | Promise<void>;
  disabled?: boolean;
  errorMessage?: string | null;
  language?: Language;
  onRetry?: () => void;
  className?: string;
}

/**
 * Prominent microphone control button.
 * Designed for older adults and accessibility-first users: large target (>60px),
 * unambiguous icon and label, aria-live status, clear error feedback.
 */
export function VoiceControl({
  state,
  onStart,
  onStop,
  disabled = false,
  errorMessage,
  language = "en",
  onRetry,
  className = "",
}: VoiceControlProps) {
  const t = getTranslations(language);
  const isActive = state === "listening" || state === "speaking" || state === "connecting";

  const getStatusLabel = () => {
    switch (state) {
      case "connecting":
        return t.voiceControl.connecting;
      case "listening":
        return t.voiceControl.listening;
      case "speaking":
        return t.voiceControl.speaking;
      case "error":
        return t.voiceControl.micError;
      case "idle":
      default:
        return t.voiceControl.startListening;
    }
  };

  const getAriaLabel = () => {
    if (isActive) {
      return `${t.voiceControl.ariaLabelStop} (${getStatusLabel()})`;
    }
    return t.voiceControl.ariaLabelStart;
  };

  const handleClick = () => {
    if (isActive) {
      void onStop();
    } else {
      void onStart();
    }
  };

  // Status-driven styling
  const getButtonStyles = () => {
    if (state === "error") {
      return "bg-rose-700 hover:bg-rose-800 text-white border-rose-900";
    }
    if (state === "listening") {
      return "bg-amber-600 hover:bg-amber-700 text-white shadow-lg ring-4 ring-amber-300 dark:ring-amber-900";
    }
    if (state === "speaking") {
      return "bg-blue-600 hover:bg-blue-700 text-white shadow-lg ring-4 ring-blue-300 dark:ring-blue-900";
    }
    if (state === "connecting") {
      return "bg-slate-700 text-slate-200 cursor-wait";
    }
    return "bg-teal-700 hover:bg-teal-800 text-white shadow-md active:bg-teal-900";
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || state === "connecting"}
        aria-label={getAriaLabel()}
        aria-pressed={isActive}
        className={`touch-target group relative inline-flex items-center justify-center gap-3.5 rounded-2xl px-7 py-4 text-lg font-bold transition-all shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
      >
        {/* Animated ripple indicator for listening state (respects reduced motion) */}
        {state === "listening" && (
          <span
            aria-hidden="true"
            className="absolute -inset-1 rounded-2xl bg-amber-400 opacity-25 motion-safe:animate-ping"
          />
        )}

        {/* Status Icon or Audio Waveform */}
        {state === "listening" ? (
          <span aria-hidden="true" className="relative flex items-center gap-1 h-7">
            <span className="w-1 bg-white rounded-full h-3 motion-safe:animate-[pulse_0.8s_ease-in-out_infinite]" />
            <span className="w-1 bg-white rounded-full h-6 motion-safe:animate-[pulse_0.6s_ease-in-out_infinite_0.1s]" />
            <span className="w-1 bg-white rounded-full h-4 motion-safe:animate-[pulse_0.7s_ease-in-out_infinite_0.2s]" />
            <span className="w-1 bg-white rounded-full h-7 motion-safe:animate-[pulse_0.5s_ease-in-out_infinite_0.15s]" />
            <span className="w-1 bg-white rounded-full h-3 motion-safe:animate-[pulse_0.8s_ease-in-out_infinite_0.25s]" />
          </span>
        ) : state === "speaking" ? (
          <span aria-hidden="true" className="relative flex items-center gap-1 h-7">
            <span className="w-1 bg-white rounded-full h-4 motion-safe:animate-[pulse_0.7s_ease-in-out_infinite]" />
            <span className="w-1 bg-white rounded-full h-6 motion-safe:animate-[pulse_0.5s_ease-in-out_infinite_0.2s]" />
            <span className="w-1 bg-white rounded-full h-5 motion-safe:animate-[pulse_0.6s_ease-in-out_infinite_0.1s]" />
            <span className="w-1 bg-white rounded-full h-3 motion-safe:animate-[pulse_0.8s_ease-in-out_infinite_0.3s]" />
          </span>
        ) : (
          <span aria-hidden="true" className="relative flex h-7 w-7 items-center justify-center">
            {state === "connecting" && (
              <svg
                className="h-6 w-6 motion-safe:animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}

            {(state === "idle" || state === "error") && (
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"
                />
              </svg>
            )}
          </span>
        )}

        {/* Text Label */}
        <span className="relative text-base sm:text-lg tracking-wide font-bold">
          {isActive ? t.voiceControl.stopListening : t.voiceControl.startListening}
        </span>
      </button>

      {/* Helper caption */}
      <p className="text-center text-xs sm:text-sm font-medium text-slate-300 dark:text-slate-400">
        {getStatusLabel()}
      </p>

      {/* Error / Permission Alert */}
      {(state === "error" || errorMessage) && (
        <div
          role="alert"
          className="w-full max-w-md rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="text-rose-600 font-bold">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">{t.voiceControl.micError}</p>
              <p className="mt-1 text-xs sm:text-sm">
                {errorMessage || t.voiceControl.micPermissionDenied}
              </p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-rose-700 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {t.common.retry}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
