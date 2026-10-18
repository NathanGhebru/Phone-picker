"use client";

import React, { useState } from "react";
import type { Language } from "@/shared/types";
import { formatCurrency, getTranslations } from "@/i18n";

export interface CostBreakdownProps {
  estimatedMonthlyTotal: number | null;
  monthlyPlanPrice: number | null;
  estimatedMonthlyDeviceCost: number | null;
  currency?: "USD";
  assumptions?: string[];
  sourceUrls?: string[];
  language?: Language;
  className?: string;
  isCompact?: boolean;
}

/**
 * Transparent, accessible cost breakdown component.
 * Explicitly separates verified plan service costs from illustrative device financing.
 * Displays source links and pricing assumptions per honest pricing contract.
 */
export function CostBreakdown({
  estimatedMonthlyTotal,
  monthlyPlanPrice,
  estimatedMonthlyDeviceCost,
  currency = "USD",
  assumptions = [],
  sourceUrls = [],
  language = "en",
  className = "",
  isCompact = false,
}: CostBreakdownProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const t = getTranslations(language);

  const formattedTotal = formatCurrency(estimatedMonthlyTotal, language);
  const formattedPlan = formatCurrency(monthlyPlanPrice, language);
  const formattedDevice = formatCurrency(estimatedMonthlyDeviceCost, language);

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 ${className}`}
    >
      <div className="flex items-baseline justify-between border-b border-slate-200 pb-3 dark:border-slate-700/60">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.recommendations.totalEstimatedMonthly}
          </span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
              {formattedTotal}
            </span>
            {estimatedMonthlyTotal !== null && (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t.common.perMonth}
              </span>
            )}
          </div>
        </div>

        {/* Currency badge */}
        <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
          {currency}
        </span>
      </div>

      {/* Cost sub-components */}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
        <div className="rounded-lg bg-white p-2.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <dt className="text-slate-500 dark:text-slate-400">{t.recommendations.monthlyPlan}</dt>
          <dd className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
            {monthlyPlanPrice !== null ? `${formattedPlan}${t.common.perMonth}` : t.recommendations.priceUnavailable}
          </dd>
        </div>

        <div className="rounded-lg bg-white p-2.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <dt className="text-slate-500 dark:text-slate-400">{t.recommendations.monthlyDevice}</dt>
          <dd className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
            {estimatedMonthlyDeviceCost !== null
              ? `${formattedDevice}${t.common.perMonth}`
              : t.recommendations.priceUnavailable}
          </dd>
        </div>
      </dl>

      {/* Pricing disclaimer */}
      <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {t.recommendations.pricingDisclaimer}
      </p>

      {/* Assumptions & Sources toggleable details */}
      {(assumptions.length > 0 || sourceUrls.length > 0) && !isCompact && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            aria-expanded={detailsOpen}
            className="touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950 dark:text-teal-400 dark:hover:text-teal-300 focus-visible:outline-none focus-visible:underline"
          >
            <span>{detailsOpen ? t.common.hideDetails : t.common.viewDetails}</span>
            <span aria-hidden="true">{detailsOpen ? "▲" : "▼"}</span>
          </button>

          {detailsOpen && (
            <div className="mt-2 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {assumptions.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    {t.recommendations.assumptionsTitle}
                  </h4>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 pl-1">
                    {assumptions.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sourceUrls.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    {t.recommendations.sourceUrlsTitle}
                  </h4>
                  <ul className="mt-1 space-y-1">
                    {sourceUrls.map((url, idx) => (
                      <li key={idx} className="truncate">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 dark:text-teal-400 underline hover:text-teal-900 dark:hover:text-teal-200 inline-flex items-center gap-1"
                        >
                          <span className="truncate">{url}</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
