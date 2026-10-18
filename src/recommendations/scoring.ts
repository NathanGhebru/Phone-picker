import type { PhoneCatalogItem, PlanCatalogItem, Preferences } from './types';
import type { CostEstimate } from './types';

export type ScoreBreakdown = { total: number; values: Record<string, number> };
const normalize = (n: number | null) => n === null ? 0 : Math.min(1, Math.max(0, n / 5));

export function scoreBundle(phone: PhoneCatalogItem, plan: PlanCatalogItem, preferences: Preferences, cost: CostEstimate): ScoreBreakdown {
  const base: Record<string, number> = { cost: 30, displayReadability: 25, battery: 15, camera: 10, simplicity: 10, hotspot: 10 };
  for (const [name, priority] of Object.entries(preferences.priorities)) if (priority !== null) base[name] = base[name] * (0.5 + priority / 5);
  const totalWeight = Object.values(base).reduce((sum, n) => sum + n, 0);
  const costValue = preferences.budgetMonthlyTotal !== null && cost.combinedMonthlyTotal !== null
    ? Math.max(0, 1 - cost.combinedMonthlyTotal / preferences.budgetMonthlyTotal)
    : cost.combinedMonthlyTotal === null ? 0 : 0.5;
  const usageValue = preferences.usage.length === 0 ? 0.5 : normalize(plan.hotspotScore) * (preferences.usage.some((u) => /hotspot|stream/i.test(u)) ? 1 : 0.75);
  const accessibilityValue = preferences.accessibilityNeeds.length === 0 ? normalize(phone.scores.displayReadability) : phone.accessibility.largeTextFeatures === 'yes' ? 1 : 0;
  const values: Record<string, number> = { cost: costValue, displayReadability: Math.max(normalize(phone.scores.displayReadability), accessibilityValue), battery: normalize(phone.scores.battery), camera: normalize(phone.scores.camera), simplicity: normalize(phone.scores.simplicity), hotspot: usageValue };
  const total = Object.entries(values).reduce((sum, [key, value]) => sum + value * base[key], 0) / totalWeight;
  return { total: Math.round(total * 10000) / 10000, values };
}
