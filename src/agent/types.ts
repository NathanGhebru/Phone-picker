import type {
  AppEvent,
  Eligibility,
  Language,
  Preferences,
  PreferenceUpdate,
  Priority,
  Recommendation,
  RecommendationResponse,
} from "../shared/types";

export type TurnSource = "voice" | "text";

export type DetectedIntentType =
  | "preference_statement"
  | "correction"
  | "cheaper_alternative"
  | "explain_recommendation"
  | "explain_term"
  | "greeting"
  | "unclear";

export interface ExtractedEntities {
  language?: Language;
  budgetMonthlyTotal?: number | null;
  budgetIncludesDevice?: boolean | null;
  maxDeviceUpfront?: number | null;
  lines?: number | null;
  devicePurchaseMode?: "monthly" | "upfront" | "unknown";
  newOrExistingCustomer?: "new" | "existing" | "unknown";
  priorities?: Partial<Preferences["priorities"]>;
  usage?: string[];
  accessibilityNeeds?: string[];
  age55Plus?: Eligibility;
  isCorrection?: boolean;
  termToExplain?: string | null;
  requestedCheaper?: boolean;
  requestedWhy?: boolean;
  rawEvidence?: string;
}

export interface ConversationHistoryEntry {
  speaker: "user" | "assistant";
  text: string;
  timestamp?: number;
}

export interface EphemeralConversationState {
  turnCount: number;
  followUpQuestionsAsked: number;
  lastQuestionAsked?: string | null;
  lastIntent?: DetectedIntentType | null;
  lastUserUtterance?: string | null;
  history: ConversationHistoryEntry[];
  unansweredQuestions: string[];
}

export interface ProcessTurnParams {
  text: string;
  source: TurnSource;
  language?: Language;
  preferences: Preferences;
  recommendations?: RecommendationResponse | null;
  selectedRecommendationId?: string | null;
  conversationState?: EphemeralConversationState | null;
  isFinal?: boolean; // defaults to true; if false, no preferences or recommendations mutated
}

export interface ProcessTurnResult {
  assistantText: string;
  preferences: Preferences;
  preferenceUpdate: PreferenceUpdate | null;
  recommendations: RecommendationResponse | null;
  selectedRecommendationId: string | null;
  conversationState: EphemeralConversationState;
  events: AppEvent[];
}
