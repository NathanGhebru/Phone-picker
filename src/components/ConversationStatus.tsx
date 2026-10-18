"use client";

import React from "react";
import type { Language } from "@/shared/types";
import { getTranslations } from "@/i18n";
import type { VoiceState } from "./VoiceControl";

export interface ConversationStatusProps {
  state: VoiceState;
  message?: string | null;
  language?: Language;
  onRetry?: () => void;
  className?: string;
}

/**
 * Visual and screen-reader accessible conversation status badge.
 * Uses polite live announcements for status updates, ensuring deaf/hard-of-hearing
 * and screen-reader users have immediate visual and audio-independent feedback.
 */
export function ConversationStatus({
  state,
  message,
  language = "en",
  onRetry,
  className = "",
}: ConversationStatusProps) {
  const t = getTranslations(language);

  const getStatusConfig = () => {
    switch (state) {
      case "connecting":
        return {
          badgeText: t.conversationStatus.connectingText,
          bgClass: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
          dotClass: "bg-slate-500",
          isAlert: false,
        };
      case "listening":
        return {
          badgeText: t.conversationStatus.listeningText,
          bgClass: "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700",
          dotClass: "bg-amber-500",
          isAlert: false,
        };
      case "speaking":
        return {
          badgeText: t.conversationStatus.speakingText,
          bgClass: "bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700",
          dotClass: "bg-blue-600",
          isAlert: false,
        };
      case "error":
        return {
          badgeText: message || t.conversationStatus.errorText,
          bgClass: "bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700",
          dotClass: "bg-rose-600",
          isAlert: true,
        };
      case "idle":
      default:
        return {
          badgeText: t.conversationStatus.idleText,
          bgClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700",
          dotClass: "bg-emerald-500",
          isAlert: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      role={config.isAlert ? "alert" : "status"}
      aria-live={config.isAlert ? "assertive" : "polite"}
      className={`inline-flex flex-wrap items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${config.bgClass} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2.5 w-2.5 rounded-full ${config.dotClass} ${
          state === "listening" || state === "speaking" ? "motion-safe:animate-pulse" : ""
        }`}
      />
      <span>{config.badgeText}</span>

      {state === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-1 underline font-semibold text-rose-800 hover:text-rose-950 dark:text-rose-300 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          {t.common.retry}
        </button>
      )}
    </div>
  );
}
