"use client";

import { VoiceMatchView } from "@/components";
import { useVoiceMatchSession } from "@/hooks/useVoiceMatchSession";

export default function Home() {
  const session = useVoiceMatchSession();

  return (
    <VoiceMatchView
      language={session.language}
      transcript={session.transcript}
      preferences={session.preferences}
      recommendations={session.recommendations}
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
