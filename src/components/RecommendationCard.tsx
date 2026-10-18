"use client";

import React, { useState } from "react";
import type { Language, Recommendation } from "@/shared/types";
import { getTranslations, translateReason, translateTradeoff } from "@/i18n";
import { CostBreakdown } from "./CostBreakdown";

export interface RecommendationCardProps {
  recommendation: Recommendation;
  isSelected?: boolean;
  onSelect?: (recommendation: Recommendation) => void;
  language?: Language;
  className?: string;
}

/**
 * Individual phone and plan recommendation bundle card.
 * Clearly differentiates Best Match / Lowest Cost / Alternative,
 * maps reason and tradeoff codes honestly, and embeds verified cost breakdown.
 */
export function RecommendationCard({
  recommendation,
  isSelected = false,
  onSelect,
  language = "en",
  className = "",
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const t = getTranslations(language);

  const getBadgeStyle = () => {
    switch (recommendation.label) {
      case "best_match":
        return {
          bg: "bg-teal-700 text-white dark:bg-teal-600",
          border: "border-teal-700",
          ring: isSelected ? "ring-4 ring-teal-500/30 border-teal-600" : "border-slate-200 dark:border-slate-800",
          title: t.recommendations.labels.best_match,
          badgeText: t.recommendations.badges.best_match,
          icon: "★",
        };
      case "lowest_cost":
        return {
          bg: "bg-emerald-700 text-white dark:bg-emerald-600",
          border: "border-emerald-700",
          ring: isSelected ? "ring-4 ring-emerald-500/30 border-emerald-600" : "border-slate-200 dark:border-slate-800",
          title: t.recommendations.labels.lowest_cost,
          badgeText: t.recommendations.badges.lowest_cost,
          icon: "🏷️",
        };
      case "alternative":
      default:
        return {
          bg: "bg-indigo-700 text-white dark:bg-indigo-600",
          border: "border-indigo-700",
          ring: isSelected ? "ring-4 ring-indigo-500/30 border-indigo-600" : "border-slate-200 dark:border-slate-800",
          title: t.recommendations.labels.alternative,
          badgeText: t.recommendations.badges.alternative,
          icon: "🔄",
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <article
      aria-label={`${badge.title}: ${recommendation.phoneId} with ${recommendation.planId}`}
      className={`flex flex-col justify-between rounded-2xl bg-white p-5 sm:p-6 shadow-sm transition-all dark:bg-slate-900 border ${badge.ring} ${className}`}
    >
      <div>
        {/* Header with Label Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${badge.bg}`}
          >
            <span aria-hidden="true">{badge.icon}</span>
            <span>{badge.badgeText}</span>
          </span>

          {isSelected && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              <span aria-hidden="true">✓</span>
              <span>{t.recommendations.selectedBadge}</span>
            </span>
          )}
        </div>

        {/* Product Names: Phone & Plan */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white leading-tight">
          {recommendation.phoneId}
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
          + {recommendation.planId}
        </p>

        {/* Cost Breakdown */}
        <div className="mt-4">
          <CostBreakdown
            estimatedMonthlyTotal={recommendation.estimatedMonthlyTotal}
            monthlyPlanPrice={recommendation.monthlyPlanPrice}
            estimatedMonthlyDeviceCost={recommendation.estimatedMonthlyDeviceCost}
            currency={recommendation.currency}
            assumptions={recommendation.assumptions}
            sourceUrls={recommendation.sourceUrls}
            language={language}
          />
        </div>

        {/* Reasons (Why this was chosen) */}
        {recommendation.reasons.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t.recommendations.reasonsTitle}
            </h4>
            <ul className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {recommendation.reasons.map((reasonCode) => (
                <li key={reasonCode} className="flex items-start gap-1.5">
                  <span aria-hidden="true" className="text-teal-600 dark:text-teal-400 font-bold">
                    ✓
                  </span>
                  <span>{translateReason(reasonCode, language)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tradeoffs (Things to keep in mind) */}
        {recommendation.tradeoffs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">
              {t.recommendations.tradeoffsTitle}
            </h4>
            <ul className="space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {recommendation.tradeoffs.map((tradeoffCode) => (
                <li key={tradeoffCode} className="flex items-start gap-1.5">
                  <span aria-hidden="true" className="text-amber-600 font-bold">
                    !
                  </span>
                  <span>{translateTradeoff(tradeoffCode, language)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Accessible Expandable Details Section */}
        <div className="mt-3 pt-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls={`rec-extra-${recommendation.id}`}
            className="touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950 dark:text-teal-300 dark:hover:text-teal-200 focus-visible:outline-none focus-visible:underline"
          >
            <span>{expanded ? t.common.hideDetails : t.common.viewDetails}</span>
            <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
          </button>
          {expanded && (
            <div id={`rec-extra-${recommendation.id}`} className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              <p><b>{t.recommendations.scoreLabel}:</b> {recommendation.rankScore}/100</p>
            </div>
          )}
        </div>
      </div>

      {/* Select button action */}
      {onSelect && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onSelect(recommendation)}
            aria-pressed={isSelected}
            className={`touch-target w-full rounded-xl px-4 py-2.5 text-sm sm:text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40 ${
              isSelected
                ? "bg-teal-700 text-white dark:bg-teal-600 hover:bg-teal-800"
                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
            }`}
          >
            {isSelected ? t.recommendations.selectedBadge : t.recommendations.selectPlanButton}
          </button>
        </div>
      )}
    </article>
  );
}
