import type { Language, Preferences, Recommendation, RecommendationResponse } from "@/shared/types";
import type { TranscriptEntry } from "@/hooks/useVoiceMatchSession";

/** Stable presentational-component boundary for the UI workstream. */
export type VoiceMatchViewProps = {
  language: Language; transcript: TranscriptEntry[]; recommendations: RecommendationResponse | null;
  selectedRecommendationId: string | null; voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
  onLanguageChange(language: Language): void; onSendMessage(text: string): void | Promise<void>;
  onStartMicrophone(): void | Promise<void>; onStopMicrophone(): void | Promise<void>;
  onSelectRecommendation(recommendation: Recommendation): void;
  preferences?: Preferences;
  onCorrectPreferences?(patch: Partial<Preferences>): void | Promise<void>;
  voiceMessage?: string | null;
  isSubmitting?: boolean;
  isLoadingRecommendations?: boolean;
  error?: string | null;
  onRetry?(): void;
};
