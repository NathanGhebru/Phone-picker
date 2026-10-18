import type { PhoneCatalogItem, PlanCatalogItem, Preferences } from './types';
import type { CostEstimate } from './types';

export function explanationCodes(phone: PhoneCatalogItem, plan: PlanCatalogItem, preferences: Preferences, cost: CostEstimate): { reasons: string[]; tradeoffs: string[] } {
  const reasons = new Set<string>();
  const tradeoffs = new Set<string>();
  if (preferences.budgetMonthlyTotal !== null && cost.combinedMonthlyTotal !== null && cost.combinedMonthlyTotal <= preferences.budgetMonthlyTotal) reasons.add('WITHIN_CONFIRMED_COMBINED_BUDGET');
  if (preferences.priorities.displayReadability !== null && phone.scores.displayReadability !== null && phone.scores.displayReadability >= 4) reasons.add('HIGH_READABILITY_HEURISTIC');
  if (preferences.priorities.battery !== null && phone.scores.battery !== null && phone.scores.battery >= 4) reasons.add('STRONG_BATTERY_HEURISTIC');
  if (preferences.priorities.camera !== null && phone.scores.camera !== null && phone.scores.camera >= 4) reasons.add('STRONG_CAMERA_HEURISTIC');
  if (preferences.priorities.simplicity !== null && phone.scores.simplicity !== null && phone.scores.simplicity >= 4) reasons.add('SIMPLE_USE_HEURISTIC');
  if ((preferences.priorities.hotspot !== null || preferences.usage.some((u) => /hotspot|stream/i.test(u))) && plan.hotspotScore !== null && plan.hotspotScore >= 4) reasons.add('SUPPORTS_HIGHER_USAGE_HEURISTIC');
  if (phone.accessibility.largeTextFeatures === 'unknown' && preferences.accessibilityNeeds.length) tradeoffs.add('ACCESSIBILITY_COMPATIBILITY_UNVERIFIED');
  if (cost.monthlyDeviceCost === null && preferences.devicePurchaseMode !== 'upfront') tradeoffs.add('DEVICE_MONTHLY_PRICE_UNAVAILABLE');
  if (cost.monthlyDeviceCost !== null && preferences.devicePurchaseMode !== 'upfront') tradeoffs.add('DEVICE_FINANCING_ESTIMATE_EXCLUDES_TAXES_FEES_CREDITS');
  if (taxesAndFeesAreExcluded(plan.taxAndFeeAssumptions)) tradeoffs.add('TAXES_AND_FEES_EXCLUDED_FROM_MONTHLY_ESTIMATE');
  if (phone.scores.camera !== null && phone.scores.camera < 3) tradeoffs.add('LOWER_CAMERA_HEURISTIC');
  if (reasons.size === 0) reasons.add('ELIGIBLE_VERIFIED_PRICE_OPTION');
  return { reasons: [...reasons].sort(), tradeoffs: [...tradeoffs].sort() };
}

function taxesAndFeesAreExcluded(assumption: string | undefined): boolean {
  return typeof assumption === 'string' && /tax|fee|surcharge/i.test(assumption) && /not included|excluded|additional/i.test(assumption);
}
