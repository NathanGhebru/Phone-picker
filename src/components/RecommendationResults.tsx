"use client";

import React from "react";
import type { Language, Recommendation, RecommendationResponse } from "@/shared/types";
import { getTranslations } from "@/i18n";
import { RecommendationCard } from "./RecommendationCard";

export interface RecommendationResultsProps {
  data: RecommendationResponse | null;
  isLoading?: boolean;
  error?: string | null;
  selectedId?: string | null;
  onSelectRecommendation?: (rec: Recommendation) => void;
  language?: Language;
  onRetry?: () => void;
  className?: string;
}

/**
 * Top-level recommendation results container.
 * Renders the top 3 curated bundles (Best Match, Lowest Cost, Alternative),
 * handles empty, loading, and error states gracefully, and displays catalog metadata.
 */
export function RecommendationResults({
  data,
  isLoading = false,
  error = null,
  selectedId = null,
  onSelectRecommendation,
  language = "en",
  onRetry,
  className = "",
}: RecommendationResultsProps) {
  const t = getTranslations(language);

  // 1. Loading State
  if (isLoading) {
    return (
      <section
        aria-live="polite"
        aria-busy="true"
        aria-label={t.recommendations.loadingTitle}
        className={`rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div
            aria-hidden="true"
            className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-teal-700 motion-safe:animate-spin dark:border-slate-700 dark:border-t-teal-400"
          />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t.recommendations.loadingTitle}
          </h3>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t.recommendations.loadingDescription}
          </p>
        </div>
      </section>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <section
        role="alert"
        aria-label={t.common.error}
        className={`rounded-2xl border border-rose-300 bg-rose-50 p-6 text-rose-950 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200 ${className}`}
      >
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="text-base font-bold">{t.common.error}</h3>
            <p className="mt-1 text-sm">{error}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="touch-target rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {t.common.retry}
            </button>
          )}
        </div>
      </section>
    );
  }

  const recommendations = data?.recommendations || [];

  // 3. Empty State
  if (!data || recommendations.length === 0) {
    return (
      <section
        aria-label={t.recommendations.emptyTitle}
        className={`rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        <div className="mx-auto max-w-lg">
          <span aria-hidden="true" className="text-4xl">📱</span>
          <h3 className="mt-3 text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.recommendations.emptyTitle}
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {t.recommendations.emptyDescription}
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs sm:text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-teal-800 dark:text-teal-300 mb-0.5">
              {language === "es" ? "Sugerencia:" : "Tip:"}
            </p>
            {t.recommendations.emptyActionTip}
          </div>
        </div>
      </section>
    );
  }

  // 4. Populated Recommendations
  return (
    <section
      aria-labelledby="recommendation-results-heading"
      className={`space-y-5 ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2
            id="recommendation-results-heading"
            className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white"
          >
            {t.recommendations.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {t.recommendations.subtitle}
          </p>
        </div>

        {data.catalogAsOf && (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {t.recommendations.catalogAsOf(data.catalogAsOf)}
          </span>
        )}
      </div>

      {/* Warnings Banner if any */}
      {data.warnings && data.warnings.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <p className="font-bold flex items-center gap-1.5">
            <span aria-hidden="true">⚠️</span>
            <span>{t.recommendations.warningsTitle}</span>
          </p>
          <ul className="mt-1 list-disc list-inside space-y-0.5 pl-1">
            {data.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions Banner if any */}
      {data.questions && data.questions.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs sm:text-sm text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-200"
        >
          <p className="font-bold flex items-center gap-1.5">
            <span aria-hidden="true">💡</span>
            <span>{t.recommendations.questionsTitle}</span>
          </p>
          <ul className="mt-1 list-disc list-inside space-y-0.5 pl-1">
            {data.questions.map((q, idx) => (
              <li key={idx}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3-Column Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            isSelected={selectedId === rec.id}
            onSelect={onSelectRecommendation}
            language={language}
          />
        ))}
      </div>

      {/* Honest pricing disclaimer */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
        {t.common.disclaimer}
      </p>
    </section>
  );
}
