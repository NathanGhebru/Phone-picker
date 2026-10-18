import type { Priority } from "@/shared/types";

export interface Translations {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    error: string;
    retry: string;
    close: string;
    edit: string;
    save: string;
    cancel: string;
    unknown: string;
    notSpecified: string;
    perMonth: string;
    linesCount: (count: number) => string;
    currency: string;
    yes: string;
    no: string;
    viewDetails: string;
    hideDetails: string;
    sources: string;
    assumptions: string;
    disclaimer: string;
  };
  languageToggle: {
    label: string;
    switchToEnglish: string;
    switchToSpanish: string;
    currentLanguageAnnouncement: (lang: string) => string;
  };
  voiceControl: {
    startListening: string;
    stopListening: string;
    connecting: string;
    listening: string;
    speaking: string;
    idle: string;
    micError: string;
    micPermissionDenied: string;
    micHelpText: string;
    ariaLabelStart: string;
    ariaLabelStop: string;
    statusAnnouncement: (status: string) => string;
  };
  conversationStatus: {
    idleText: string;
    connectingText: string;
    listeningText: string;
    speakingText: string;
    errorText: string;
    networkNotice: string;
  };
  transcript: {
    title: string;
    emptyState: string;
    userSpeaker: string;
    assistantSpeaker: string;
    listeningBadge: string;
    thinkingBadge: string;
    liveRegionLabel: string;
  };
  chatInput: {
    placeholder: string;
    sendButton: string;
    typeInsteadHeading: string;
    typeInsteadHint: string;
    inputAriaLabel: string;
    disabledHint: string;
  };
  preferences: {
    title: string;
    subtitle: string;
    budgetTotal: string;
    budgetDeviceIncluded: string;
    budgetServiceOnly: string;
    lines: string;
    customerStatus: string;
    customerNew: string;
    customerExisting: string;
    devicePurchaseMode: string;
    deviceModeMonthly: string;
    deviceModeUpfront: string;
    prioritiesTitle: string;
    priorities: {
      camera: string;
      battery: string;
      displayReadability: string;
      simplicity: string;
      hotspot: string;
    };
    priorityLevel: (level: Priority) => string;
    usageTitle: string;
    accessibilityNeedsTitle: string;
    eligibilityTitle: string;
    age55Discount: string;
    eligibleYes: string;
    eligibleNo: string;
    eligibleUnknown: string;
    correctButton: string;
    modalTitle: string;
    budgetInputLabel: string;
    linesInputLabel: string;
    saveChanges: string;
  };
  recommendations: {
    title: string;
    subtitle: string;
    catalogAsOf: (date: string) => string;
    emptyTitle: string;
    emptyDescription: string;
    emptyActionTip: string;
    loadingTitle: string;
    loadingDescription: string;
    labels: {
      best_match: string;
      lowest_cost: string;
      alternative: string;
    };
    badges: {
      best_match: string;
      lowest_cost: string;
      alternative: string;
    };
    reasonsTitle: string;
    tradeoffsTitle: string;
    costBreakdownTitle: string;
    monthlyPlan: string;
    monthlyDevice: string;
    monthlyTotal: string;
    totalEstimatedMonthly: string;
    priceUnavailable: string;
    pricingDisclaimer: string;
    inspectOfferButton: string;
    selectedBadge: string;
    selectPlanButton: string;
    sourceUrlsTitle: string;
    assumptionsTitle: string;
    scoreLabel: string;
    questionsTitle: string;
    warningsTitle: string;
  };
  reasons: Record<string, string>;
  tradeoffs: Record<string, string>;
  usages: Record<string, string>;
  accessibilityOptions: Record<string, string>;
}
