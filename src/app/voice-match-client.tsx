"use client";

import { useMemo } from "react";
import { VoiceMatchView } from "@/components";
import { useVoiceMatchSession } from "@/hooks/useVoiceMatchSession";
import type { RecommendationResponse } from "@/shared/types";

type VoiceMatchClientProps = {
  phoneNames: Record<string, string>;
  planNames: Record<string, string>;
};

function displayRecommendations(
  response: RecommendationResponse | null,
  phoneNames: Record<string, string>,
  planNames: Record<string, string>,
): RecommendationResponse | null {
  if (!response) return null;
  return {
    ...response,
    // The session retains the authoritative API response. These are display
    // labels only; selection and engine context keep stable recommendation IDs.
    recommendations: response.recommendations.map((recommendation) => ({
      ...recommendation,
      phoneId: phoneNames[recommendation.phoneId] ?? recommendation.phoneId,
      planId: planNames[recommendation.planId] ?? recommendation.planId,
    })),
  };
}

export function VoiceMatchClient({ phoneNames, planNames }: VoiceMatchClientProps) {
  const session = useVoiceMatchSession();
  const recommendations = useMemo(
    () => displayRecommendations(session.recommendations, phoneNames, planNames),
    [phoneNames, planNames, session.recommendations],
  );

  return (
    <VoiceMatchView
      language={session.language}
      transcript={session.transcript}
      preferences={session.preferences}
      recommendations={recommendations}
      selectedRecommendationId={session.selectedRecommendationId}
      voiceState={session.voiceState}
      voiceMessage={session.voiceMessage}
      isSubmitting={session.isSubmitting}
      isLoadingRecommendations={session.isSubmitting}
      error={session.error}
      onLanguageChange={session.setLanguage}
      onSendMessage={session.submitMessage}
      onStartMicrophone={session.startVoice}
      onStopMicrophone={session.stopVoice}
      onSelectRecommendation={(recommendation) => session.selectRecommendation(recommendation.id)}
      onCorrectPreferences={session.correctPreferences}
      onRetry={() => { void session.retry(); }}
    />
  );
}
