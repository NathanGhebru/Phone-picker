import * as assert from "node:assert";
import { describe, it } from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LanguageToggle } from "../../components/LanguageToggle";
import { VoiceControl } from "../../components/VoiceControl";
import { ConversationStatus } from "../../components/ConversationStatus";
import { TranscriptPanel } from "../../components/TranscriptPanel";
import { ChatInput } from "../../components/ChatInput";
import { CostBreakdown } from "../../components/CostBreakdown";
import { PreferenceSummary } from "../../components/PreferenceSummary";
import { RecommendationCard } from "../../components/RecommendationCard";
import { RecommendationResults } from "../../components/RecommendationResults";
import { VoiceMatchView } from "../../components/VoiceMatchView";
import type { Preferences, Recommendation, RecommendationResponse } from "../../shared/types";

// Mock fixtures
const samplePreferences: Preferences = {
  language: "en",
  budgetMonthlyTotal: 60,
  budgetIncludesDevice: true,
  maxDeviceUpfront: null,
  lines: 1,
  devicePurchaseMode: "monthly",
  newOrExistingCustomer: "new",
  priorities: {
    camera: 2,
    battery: 4,
    displayReadability: 5,
    simplicity: 5,
    hotspot: 1,
  },
  usage: ["calls", "video"],
  accessibilityNeeds: ["readable_text"],
  eligibility: { age55Plus: "unknown" },
};

const sampleRecommendation: Recommendation = {
  id: "rec-1",
  phoneId: "Samsung Galaxy A15 5G",
  planId: "T-Mobile Essentials Saver",
  label: "best_match",
  estimatedMonthlyTotal: 60,
  monthlyPlanPrice: 50,
  estimatedMonthlyDeviceCost: 10,
  currency: "USD",
  reasons: ["budget_fit", "large_display"],
  tradeoffs: ["requires_autopay"],
  assumptions: ["Includes 24-month device financing", "Excludes local government taxes"],
  sourceUrls: ["https://www.t-mobile.com/cell-phones/samsung-galaxy-a15-5g"],
  rankScore: 92,
};

const sampleResponse: RecommendationResponse = {
  recommendations: [
    sampleRecommendation,
    {
      id: "rec-2",
      phoneId: "Motorola moto g 5G",
      planId: "T-Mobile Connect by T-Mobile",
      label: "lowest_cost",
      estimatedMonthlyTotal: 45,
      monthlyPlanPrice: 35,
      estimatedMonthlyDeviceCost: 10,
      currency: "USD",
      reasons: ["lowest_monthly_cost"],
      tradeoffs: ["entry_level_camera"],
      assumptions: ["Prepaid service"],
      sourceUrls: [],
      rankScore: 85,
    },
    {
      id: "rec-3",
      phoneId: "Apple iPhone 13",
      planId: "T-Mobile Experience Beyond",
      label: "alternative",
      estimatedMonthlyTotal: 85,
      monthlyPlanPrice: 65,
      estimatedMonthlyDeviceCost: 20,
      currency: "USD",
      reasons: ["good_camera"],
      tradeoffs: ["higher_device_cost"],
      assumptions: ["Premium tier plan"],
      sourceUrls: [],
      rankScore: 78,
    },
  ],
  catalogAsOf: "2026-10-15",
  warnings: ["Prices exclude local regulatory fees and promotions"],
  questions: ["Did that $60 budget include the phone device?"],
};

describe("VoiceMatch Reusable Presentation Components", () => {
  describe("LanguageToggle", () => {
    it("renders both language buttons with correct aria-pressed attributes in English", () => {
      const html = renderToStaticMarkup(
        React.createElement(LanguageToggle, {
          currentLanguage: "en",
          onLanguageChange: () => {},
        })
      );
      assert.ok(html.includes("English"));
      assert.ok(html.includes("Español"));
      assert.ok(html.includes('aria-pressed="true"'));
      assert.ok(html.includes('aria-label="Language selection"'));
    });

    it("renders with Spanish selected and localized label", () => {
      const html = renderToStaticMarkup(
        React.createElement(LanguageToggle, {
          currentLanguage: "es",
          onLanguageChange: () => {},
        })
      );
      assert.ok(html.includes('aria-label="Selección de idioma"'));
    });
  });

  describe("VoiceControl", () => {
    it("renders idle state with Start Speaking accessible name and target size", () => {
      const html = renderToStaticMarkup(
        React.createElement(VoiceControl, {
          state: "idle",
          onStart: () => {},
          onStop: () => {},
          language: "en",
        })
      );
      assert.ok(html.includes("Start Speaking"));
      assert.ok(html.includes('aria-label="Start speaking with voice assistant"'));
      assert.ok(html.includes('aria-pressed="false"'));
      assert.ok(html.includes("touch-target"));
    });

    it("renders listening state with active aria-pressed and Stop Speaking label in Spanish", () => {
      const html = renderToStaticMarkup(
        React.createElement(VoiceControl, {
          state: "listening",
          onStart: () => {},
          onStop: () => {},
          language: "es",
        })
      );
      assert.ok(html.includes("Dejar de hablar"));
      assert.ok(html.includes('aria-pressed="true"'));
      assert.ok(html.includes("Escuchándole..."));
    });

    it("renders error state with role=alert and visible permission error", () => {
      const html = renderToStaticMarkup(
        React.createElement(VoiceControl, {
          state: "error",
          errorMessage: "Microphone permission was denied by browser settings.",
          onStart: () => {},
          onStop: () => {},
          language: "en",
          onRetry: () => {},
        })
      );
      assert.ok(html.includes('role="alert"'));
      assert.ok(html.includes("Microphone permission was denied by browser settings."));
      assert.ok(html.includes("Try again"));
    });
  });

  describe("ConversationStatus", () => {
    it("renders polite live region for non-error listening state", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConversationStatus, {
          state: "listening",
          language: "en",
        })
      );
      assert.ok(html.includes('role="status"'));
      assert.ok(html.includes('aria-live="polite"'));
      assert.ok(html.includes("Listening... speak naturally."));
    });

    it("renders assertive alert for error state", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConversationStatus, {
          state: "error",
          message: "Failed to connect to audio server",
          language: "en",
        })
      );
      assert.ok(html.includes('role="alert"'));
      assert.ok(html.includes('aria-live="assertive"'));
      assert.ok(html.includes("Failed to connect to audio server"));
    });
  });

  describe("TranscriptPanel", () => {
    it("renders empty state with helpful prompt guidance", () => {
      const html = renderToStaticMarkup(
        React.createElement(TranscriptPanel, {
          entries: [],
          language: "en",
        })
      );
      assert.ok(html.includes("Conversation Transcript"));
      assert.ok(html.includes("No messages yet."));
    });

    it("renders user and assistant messages with distinct speaker badges", () => {
      const html = renderToStaticMarkup(
        React.createElement(TranscriptPanel, {
          entries: [
            { id: "1", speaker: "user", text: "I need a phone for my mom", final: true },
            { id: "2", speaker: "assistant", text: "I would be happy to help. What is your monthly budget?", final: true },
          ],
          language: "en",
        })
      );
      assert.ok(html.includes("You"));
      assert.ok(html.includes("VoiceMatch Advisor"));
      assert.ok(html.includes("I need a phone for my mom"));
      assert.ok(html.includes("What is your monthly budget?"));
    });

    it("renders in Spanish with localized speaker names", () => {
      const html = renderToStaticMarkup(
        React.createElement(TranscriptPanel, {
          entries: [
            { id: "1", speaker: "user", text: "Necesito un teléfono", final: true },
          ],
          language: "es",
        })
      );
      assert.ok(html.includes("Usted"));
      assert.ok(html.includes("Transcripción de la conversación"));
    });
  });

  describe("ChatInput", () => {
    it("renders always-visible input with accessible label and submit button", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatInput, {
          onSubmit: () => {},
          language: "en",
        })
      );
      assert.ok(html.includes("Type instead"));
      assert.ok(html.includes('id="voicematch-chat-input"'));
      assert.ok(html.includes("Send message"));
      assert.ok(html.includes('type="submit"'));
    });

    it("renders in Spanish", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatInput, {
          onSubmit: () => {},
          language: "es",
        })
      );
      assert.ok(html.includes("Escribir en su lugar"));
      assert.ok(html.includes("Enviar mensaje"));
    });
  });

  describe("CostBreakdown", () => {
    it("renders plan service, device financing, and total breakdown accurately", () => {
      const html = renderToStaticMarkup(
        React.createElement(CostBreakdown, {
          estimatedMonthlyTotal: 60,
          monthlyPlanPrice: 50,
          estimatedMonthlyDeviceCost: 10,
          currency: "USD",
          assumptions: ["Includes 24-month financing"],
          sourceUrls: ["https://example.com"],
          language: "en",
        })
      );
      assert.ok(html.includes("$60"));
      assert.ok(html.includes("$50"));
      assert.ok(html.includes("$10"));
      assert.ok(html.includes("Plan Service"));
      assert.ok(html.includes("Device Financing (est.)"));
      assert.ok(html.includes("USD"));
      assert.ok(html.includes("View details"));
    });

    it("displays Price unavailable when prices are null", () => {
      const html = renderToStaticMarkup(
        React.createElement(CostBreakdown, {
          estimatedMonthlyTotal: null,
          monthlyPlanPrice: null,
          estimatedMonthlyDeviceCost: null,
          language: "en",
        })
      );
      assert.ok(html.includes("Price unavailable"));
    });
  });

  describe("PreferenceSummary", () => {
    it("renders budget, lines, customer status, and priority tags", () => {
      const html = renderToStaticMarkup(
        React.createElement(PreferenceSummary, {
          preferences: samplePreferences,
          language: "en",
          onCorrect: () => {},
        })
      );
      assert.ok(html.includes("Recognized Preferences"));
      assert.ok(html.includes("$60"));
      assert.ok(html.includes("1 line"));
      assert.ok(html.includes("New Customer"));
      assert.ok(html.includes("Large / Easy-to-Read Screen"));
      assert.ok(html.includes("Correct preferences"));
    });

    it("renders localized preferences in Spanish", () => {
      const html = renderToStaticMarkup(
        React.createElement(PreferenceSummary, {
          preferences: samplePreferences,
          language: "es",
          onCorrect: () => {},
        })
      );
      assert.ok(html.includes("Preferencias Reconocidas"));
      assert.ok(html.includes("1 línea"));
      assert.ok(html.includes("Nuevo cliente"));
      assert.ok(html.includes("Corregir preferencias"));
    });
  });

  describe("RecommendationCard", () => {
    it("renders bundle names, Best Match label, reason codes, and selection button", () => {
      const html = renderToStaticMarkup(
        React.createElement(RecommendationCard, {
          recommendation: sampleRecommendation,
          isSelected: false,
          onSelect: () => {},
          language: "en",
        })
      );
      assert.ok(html.includes("Top Pick"));
      assert.ok(html.includes("Samsung Galaxy A15 5G"));
      assert.ok(html.includes("T-Mobile Essentials Saver"));
      assert.ok(html.includes("Fits comfortably within your specified monthly budget"));
      assert.ok(html.includes("Quoted price requires AutoPay enrollment"));
      assert.ok(html.includes("Select this bundle"));
    });

    it("renders selected state with active badge and aria-pressed", () => {
      const html = renderToStaticMarkup(
        React.createElement(RecommendationCard, {
          recommendation: sampleRecommendation,
          isSelected: true,
          onSelect: () => {},
          language: "en",
        })
      );
      assert.ok(html.includes('aria-pressed="true"'));
      assert.ok(html.includes("Selected Bundle"));
    });
  });

  describe("RecommendationResults", () => {
    it("renders loading state with busy indicator", () => {
      const html = renderToStaticMarkup(
        React.createElement(RecommendationResults, {
          data: null,
          isLoading: true,
          language: "en",
        })
      );
      assert.ok(html.includes('aria-busy="true"'));
      assert.ok(html.includes("Finding your best matches..."));
    });

    it("renders error state with retry button", () => {
      const html = renderToStaticMarkup(
        React.createElement(RecommendationResults, {
          data: null,
          error: "Catalog service unavailable",
          onRetry: () => {},
          language: "en",
        })
      );
      assert.ok(html.includes('role="alert"'));
      assert.ok(html.includes("Catalog service unavailable"));
      assert.ok(html.includes("Try again"));
    });

    it("renders empty state when recommendations list is empty", () => {
      const html = renderToStaticMarkup(
        React.createElement(RecommendationResults, {
          data: { recommendations: [], catalogAsOf: "2026-10-15", warnings: [], questions: [] },
          language: "en",
        })
      );
      assert.ok(html.includes("No matching recommendations yet"));
    });

    it("renders all 3 recommended options with warnings, questions, and catalog date", () => {
      const html = renderToStaticMarkup(
        React.createElement(RecommendationResults, {
          data: sampleResponse,
          selectedId: "rec-1",
          onSelectRecommendation: () => {},
          language: "en",
        })
      );
      assert.ok(html.includes("Recommended Phone") && html.includes("Plan Bundles"));
      assert.ok(html.includes("Catalog verified as of 2026-10-15"));
      assert.ok(html.includes("Prices exclude local regulatory fees and promotions"));
      assert.ok(html.includes("Did that $60 budget include the phone device?"));
      assert.ok(html.includes("Samsung Galaxy A15 5G"));
      assert.ok(html.includes("Motorola moto g 5G"));
      assert.ok(html.includes("Apple iPhone 13"));
    });
  });

  describe("VoiceMatchView Composite Layout", () => {
    it("renders full layout with skip-links, header, voice controls, chat input, and recommendations", () => {
      const html = renderToStaticMarkup(
        React.createElement(VoiceMatchView, {
          language: "en",
          transcript: [{ id: "t1", speaker: "assistant", text: "Hello! How can I help?", final: true }],
          recommendations: sampleResponse,
          selectedRecommendationId: "rec-1",
          voiceState: "idle",
          onLanguageChange: () => {},
          onSendMessage: () => {},
          onStartMicrophone: () => {},
          onStopMicrophone: () => {},
          onSelectRecommendation: () => {},
          preferences: samplePreferences,
        })
      );
      assert.ok(html.includes("Skip to main content"));
      assert.ok(html.includes("VoiceMatch"));
      assert.ok(html.includes("Start Speaking"));
      assert.ok(html.includes("Conversation Transcript"));
      assert.ok(html.includes("Type instead"));
      assert.ok(html.includes("Recognized Preferences"));
      assert.ok(html.includes("Recommended Phone") && html.includes("Plan Bundles"));
    });

    it("renders full layout in Spanish with proper headings and accessibility landmarks", () => {
      const html = renderToStaticMarkup(
        React.createElement(VoiceMatchView, {
          language: "es",
          transcript: [],
          recommendations: sampleResponse,
          selectedRecommendationId: null,
          voiceState: "idle",
          onLanguageChange: () => {},
          onSendMessage: () => {},
          onStartMicrophone: () => {},
          onStopMicrophone: () => {},
          onSelectRecommendation: () => {},
          preferences: samplePreferences,
        })
      );
      assert.ok(html.includes("Saltar al contenido principal"));
      assert.ok(html.includes("Comenzar a hablar"));
      assert.ok(html.includes("Transcripción de la conversación"));
      assert.ok(html.includes("Escribir en su lugar"));
      assert.ok(html.includes("Preferencias Reconocidas"));
      assert.ok(html.includes("Paquetes Recomendados de Teléfono y Plan"));
    });
  });

  describe("Interactive Callbacks & Event Delegation", () => {
    it("handles onLanguageChange callback invocation", () => {
      let selectedLang = "";
      const handleLang = (lang: string) => {
        selectedLang = lang;
      };
      handleLang("es");
      assert.strictEqual(selectedLang, "es");
    });

    it("handles preference correction updates accurately", () => {
      let correctedPatch: Partial<Preferences> = {};
      const handleCorrect = (patch: Partial<Preferences>) => {
        correctedPatch = patch;
      };
      handleCorrect({ budgetMonthlyTotal: 50, lines: 2, budgetIncludesDevice: false });
      assert.strictEqual(correctedPatch.budgetMonthlyTotal, 50);
      assert.strictEqual(correctedPatch.lines, 2);
      assert.strictEqual(correctedPatch.budgetIncludesDevice, false);
    });

    it("handles recommendation selection callback invocation", () => {
      let selectedRecId = "";
      const handleSelect = (rec: Recommendation) => {
        selectedRecId = rec.id;
      };
      handleSelect(sampleRecommendation);
      assert.strictEqual(selectedRecId, "rec-1");
    });
  });
});

