"use client";

import React from "react";
import type { Language } from "@/shared/types";
import { getTranslations } from "@/i18n";

export interface LanguageToggleProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Explicit English / Español language selector.
 * Fully keyboard-accessible with aria-pressed states and clear visual feedback.
 */
export function LanguageToggle({
  currentLanguage,
  onLanguageChange,
  disabled = false,
  className = "",
}: LanguageToggleProps) {
  const t = getTranslations(currentLanguage);

  return (
    <div
      role="group"
      aria-label={t.languageToggle.label}
      className={`inline-flex items-center rounded-full bg-slate-200/80 p-1 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60 ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (currentLanguage !== "en") onLanguageChange("en");
        }}
        aria-pressed={currentLanguage === "en"}
        className={`touch-target flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400 ${
          currentLanguage === "en"
            ? "bg-teal-700 text-white shadow-sm dark:bg-teal-600"
            : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span aria-hidden="true" className="mr-1.5">🇺🇸</span>
        English
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (currentLanguage !== "es") onLanguageChange("es");
        }}
        aria-pressed={currentLanguage === "es"}
        className={`touch-target flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-teal-600 dark:focus-visible:ring-teal-400 ${
          currentLanguage === "es"
            ? "bg-teal-700 text-white shadow-sm dark:bg-teal-600"
            : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span aria-hidden="true" className="mr-1.5">🇲🇽</span>
        Español
      </button>
    </div>
  );
}
