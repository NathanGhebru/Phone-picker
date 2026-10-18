"use client";

import React, { useState, FormEvent, KeyboardEvent } from "react";
import type { Language } from "@/shared/types";
import { getTranslations } from "@/i18n";

export interface ChatInputProps {
  onSubmit: (text: string) => void | Promise<void>;
  disabled?: boolean;
  language?: Language;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

/**
 * Always-visible typed fallback input for non-voice or voice-impaired interactions.
 * Supports keyboard submission (Enter) and displays clear accessibility labels.
 */
export function ChatInput({
  onSubmit,
  disabled = false,
  language = "en",
  placeholder,
  defaultValue = "",
  className = "",
}: ChatInputProps) {
  const [text, setText] = useState(defaultValue);
  const t = getTranslations(language);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    void onSubmit(trimmed);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const resolvedPlaceholder = placeholder || t.chatInput.placeholder;

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t.chatInput.typeInsteadHeading}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.chatInput.typeInsteadHint}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="voicematch-chat-input" className="sr-only">
            {t.chatInput.inputAriaLabel}
          </label>
          <input
            id="voicematch-chat-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={resolvedPlaceholder}
            className="touch-target w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-500/20 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="touch-target inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-teal-800 active:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 dark:bg-teal-600 dark:hover:bg-teal-700"
        >
          <span>{t.chatInput.sendButton}</span>
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
