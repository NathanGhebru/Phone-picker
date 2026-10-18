"use client";

import React, { useState } from "react";
import type { Language, Preferences, Priority } from "@/shared/types";
import {
  formatCurrency,
  getTranslations,
  translateAccessibilityNeed,
  translatePriorityKey,
  translatePriorityLevel,
  translateUsage,
} from "@/i18n";

export interface PreferenceSummaryProps {
  preferences: Preferences;
  language?: Language;
  onCorrect?: (update: Partial<Preferences>) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Human-readable summary of recognized preferences.
 * Provides accessible correction affordances to prevent incorrect AI assumptions
 * and give users agency over their shopping constraints.
 */
export function PreferenceSummary({
  preferences,
  language = "en",
  onCorrect,
  readOnly = false,
  className = "",
}: PreferenceSummaryProps) {
  const t = getTranslations(language);
  const [isEditing, setIsEditing] = useState(false);
  const [editBudget, setEditBudget] = useState(
    preferences.budgetMonthlyTotal !== null ? String(preferences.budgetMonthlyTotal) : ""
  );
  const [editLines, setEditLines] = useState(
    preferences.lines !== null ? String(preferences.lines) : "1"
  );
  const [editDeviceIncluded, setEditDeviceIncluded] = useState(
    preferences.budgetIncludesDevice ?? true
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCorrect) return;

    const parsedBudget = editBudget.trim() ? Number(editBudget) : null;
    const parsedLines = editLines.trim() ? Math.max(1, parseInt(editLines, 10)) : 1;

    onCorrect({
      budgetMonthlyTotal: parsedBudget !== null && !isNaN(parsedBudget) ? parsedBudget : null,
      lines: parsedLines,
      budgetIncludesDevice: editDeviceIncluded,
    });
    setIsEditing(false);
  };

  const priorityKeys: Array<keyof Preferences["priorities"]> = [
    "displayReadability",
    "simplicity",
    "battery",
    "camera",
    "hotspot",
  ];

  return (
    <section
      aria-labelledby="preferences-summary-heading"
      className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2
            id="preferences-summary-heading"
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
          >
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            {t.preferences.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t.preferences.subtitle}
          </p>
        </div>

        {!readOnly && onCorrect && (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            aria-expanded={isEditing}
            className="touch-target inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
            <span>{isEditing ? t.common.cancel : t.preferences.correctButton}</span>
          </button>
        )}
      </div>

      {/* Editing Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {t.preferences.modalTitle}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-budget"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t.preferences.budgetInputLabel}
              </label>
              <input
                id="edit-budget"
                type="number"
                min="0"
                step="5"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                placeholder="e.g. 60"
                className="touch-target w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>

            <div>
              <label
                htmlFor="edit-lines"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t.preferences.linesInputLabel}
              </label>
              <input
                id="edit-lines"
                type="number"
                min="1"
                max="10"
                value={editLines}
                onChange={(e) => setEditLines(e.target.value)}
                className="touch-target w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="edit-device-included"
              type="checkbox"
              checked={editDeviceIncluded}
              onChange={(e) => setEditDeviceIncluded(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label
              htmlFor="edit-device-included"
              className="text-xs sm:text-sm text-slate-700 dark:text-slate-300"
            >
              {t.preferences.budgetDeviceIncluded}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs sm:text-sm font-bold text-white hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {t.preferences.saveChanges}
            </button>
          </div>
        </form>
      ) : (
        /* Summary Chips Grid */
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Monthly Budget */}
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.preferences.budgetTotal}
              </span>
              <span className="mt-1 block text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {preferences.budgetMonthlyTotal !== null
                  ? `${formatCurrency(preferences.budgetMonthlyTotal, language)}${t.common.perMonth}`
                  : t.common.notSpecified}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {preferences.budgetIncludesDevice
                  ? t.preferences.budgetDeviceIncluded
                  : t.preferences.budgetServiceOnly}
              </span>
            </div>

            {/* Lines */}
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.preferences.lines}
              </span>
              <span className="mt-1 block text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {preferences.lines !== null
                  ? t.common.linesCount(preferences.lines)
                  : t.common.notSpecified}
              </span>
            </div>

            {/* Customer Status */}
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.preferences.customerStatus}
              </span>
              <span className="mt-1 block text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                {preferences.newOrExistingCustomer === "new"
                  ? t.preferences.customerNew
                  : preferences.newOrExistingCustomer === "existing"
                  ? t.preferences.customerExisting
                  : t.common.unknown}
              </span>
            </div>

            {/* Payment Mode */}
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.preferences.devicePurchaseMode}
              </span>
              <span className="mt-1 block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                {preferences.devicePurchaseMode === "monthly"
                  ? t.preferences.deviceModeMonthly
                  : preferences.devicePurchaseMode === "upfront"
                  ? t.preferences.deviceModeUpfront
                  : t.common.unknown}
              </span>
            </div>
          </div>

          {/* Priority Badges */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t.preferences.prioritiesTitle}
            </h3>
            <div className="flex flex-wrap gap-2">
              {priorityKeys.map((key) => {
                const level = preferences.priorities[key];
                if (level === null || level === undefined) return null;
                const isHigh = level >= 4;
                return (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border ${
                      isHigh
                        ? "bg-teal-50 text-teal-900 border-teal-300 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-700"
                        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <span className="font-semibold">{translatePriorityKey(key, language)}:</span>
                    <span>{translatePriorityLevel(level as Priority, language)} ({level}/5)</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Usages and Accessibility Tags */}
          {(preferences.usage.length > 0 || preferences.accessibilityNeeds.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {preferences.usage.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.preferences.usageTitle}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences.usage.map((u) => (
                      <span
                        key={u}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium"
                      >
                        {translateUsage(u, language)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {preferences.accessibilityNeeds.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    {t.preferences.accessibilityNeedsTitle}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences.accessibilityNeeds.map((need) => (
                      <span
                        key={need}
                        className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-800 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800 font-medium"
                      >
                        {translateAccessibilityNeed(need, language)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 55+ Discount Status */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              {t.preferences.age55Discount}:
            </span>
            <span
              className={`rounded px-2 py-0.5 font-medium ${
                preferences.eligibility.age55Plus === "yes"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : preferences.eligibility.age55Plus === "no"
                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {preferences.eligibility.age55Plus === "yes"
                ? t.preferences.eligibleYes
                : preferences.eligibility.age55Plus === "no"
                ? t.preferences.eligibleNo
                : t.preferences.eligibleUnknown}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
