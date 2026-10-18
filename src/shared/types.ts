
export type Language = "en" | "es";

export type Confidence = "explicit" | "inferred" | "unknown";

export type Eligibility = "yes" | "no" | "unknown";

export type Priority = 1 | 2 | 3 | 4 | 5;

export type Preferences = {
  language: Language;
  budgetMonthlyTotal: number | null;
  budgetIncludesDevice: boolean | null;
  maxDeviceUpfront: number | null;
  lines: number | null;
  devicePurchaseMode: "monthly" | "upfront" | "unknown";
  newOrExistingCustomer: "new" | "existing" | "unknown";
  priorities: {
    camera: Priority | null;
    battery: Priority | null;
    displayReadability: Priority | null;
    simplicity: Priority | null;
    hotspot: Priority | null;
  };
  usage: string[];
  accessibilityNeeds: string[];
  eligibility: {
    age55Plus: Eligibility;
  };
};

export type PreferenceUpdate = {
  patch: Partial<Preferences>;
  evidence?: string;
  source: "voice" | "text" | "ui";
};

export type Recommendation = {
  id: string;
  phoneId: string;
  planId: string;
  label: "best_match" | "lowest_cost" | "alternative";
  estimatedMonthlyTotal: number | null;
  monthlyPlanPrice: number | null;
  estimatedMonthlyDeviceCost: number | null;
  currency: "USD";
  reasons: string[];
  tradeoffs: string[];
  assumptions: string[];
  sourceUrls: string[];
  rankScore: number;
};

export type RecommendationResponse = {
  recommendations: Recommendation[];
  catalogAsOf: string;
  warnings: string[];
  questions: string[];
};

export type AppEvent =
  | {
      type: "transcript";
      speaker: "user" | "assistant";
      text: string;
      final: boolean;
    }
  | {
      type: "listening_state";
      state: "idle" | "connecting" | "listening" | "speaking" | "error";
      message?: string;
    }
  | {
      type: "preferences_updated";
      preferences: Preferences;
    }
  | {
      type: "recommendations_updated";
      data: RecommendationResponse;
    }
  | {
      type: "language_changed";
      language: Language;
    };
