import type { Preferences, RecommendationResponse } from "../shared/types";

export const MOCK_FIXTURE_EN_BUDGET_PARENT_PREFS: Preferences = {
  language: "en",
  budgetMonthlyTotal: 60,
  budgetIncludesDevice: true,
  maxDeviceUpfront: null,
  lines: 1,
  devicePurchaseMode: "monthly",
  newOrExistingCustomer: "new",
  priorities: {
    camera: null,
    battery: 4,
    displayReadability: 5,
    simplicity: 5,
    hotspot: null,
  },
  usage: ["calls", "youtube", "video"],
  accessibilityNeeds: ["readable_text"],
  eligibility: {
    age55Plus: "unknown",
  },
};

export const MOCK_FIXTURE_EN_RECOMMENDATIONS: RecommendationResponse = {
  recommendations: [
    {
      id: "rec-1-best",
      phoneId: "samsung-galaxy-a15-5g",
      planId: "tmobile-essentials-saver",
      label: "best_match",
      estimatedMonthlyTotal: 58,
      monthlyPlanPrice: 50,
      estimatedMonthlyDeviceCost: 8,
      currency: "USD",
      reasons: ["budget_fit", "large_display", "simple_ui", "streaming_data"],
      tradeoffs: ["entry_level_camera", "requires_autopay"],
      assumptions: [
        "Estimates based on 1 line with AutoPay",
        "Device financed over 24 months, before taxes and fees",
      ],
      sourceUrls: ["https://www.t-mobile.com/cell-phones", "https://www.t-mobile.com/plans"],
      rankScore: 0.94,
    },
    {
      id: "rec-2-lowest",
      phoneId: "motorola-moto-g-5g",
      planId: "tmobile-essentials-saver",
      label: "lowest_cost",
      estimatedMonthlyTotal: 54,
      monthlyPlanPrice: 50,
      estimatedMonthlyDeviceCost: 4,
      currency: "USD",
      reasons: ["lowest_monthly_cost", "long_battery", "large_display"],
      tradeoffs: ["entry_level_camera", "requires_autopay"],
      assumptions: [
        "Estimates based on 1 line with AutoPay",
        "Device financed over 24 months",
      ],
      sourceUrls: ["https://www.t-mobile.com/cell-phones"],
      rankScore: 0.88,
    },
    {
      id: "rec-3-alt",
      phoneId: "apple-iphone-13",
      planId: "tmobile-essentials-saver",
      label: "alternative",
      estimatedMonthlyTotal: 65,
      monthlyPlanPrice: 50,
      estimatedMonthlyDeviceCost: 15,
      currency: "USD",
      reasons: ["good_camera", "simple_ui"],
      tradeoffs: ["higher_device_cost", "smaller_display"],
      assumptions: [
        "Estimates based on 1 line with AutoPay",
        "Slightly over standard budget, offered as premium alternative",
      ],
      sourceUrls: ["https://www.t-mobile.com/cell-phones"],
      rankScore: 0.79,
    },
  ],
  catalogAsOf: "2026-10-17",
  warnings: [],
  questions: [],
};

export const MOCK_FIXTURE_NO_MATCH_RESPONSE: RecommendationResponse = {
  recommendations: [],
  catalogAsOf: "2026-10-17",
  warnings: [
    "No combinations meet the requested total monthly budget of $15/month for 1 line.",
  ],
  questions: ["Would you like to consider plan-only options or a higher monthly budget?"],
};
