import { estimateCost } from './cost';
import { checkEligibility } from './eligibility';
import { explanationCodes } from './explanations';
import { scoreBundle } from './scoring';
import { validatePreferences } from './validate-preferences';
import type { Catalog, Preferences, Recommendation, RecommendationResponse } from './types';

type Candidate = Recommendation & { phoneId: string; planId: string };

const questionsByReason: Record<string, string> = {
  BUDGET_SCOPE_UNCONFIRMED: 'Does your monthly budget include the phone payment as well as service?',
  LINE_COUNT_REQUIRED: 'How many phone lines do you need?',
  AGE_55_PLUS_ELIGIBILITY_UNCONFIRMED: 'Are you eligible for a 55+ plan?',
  DEVICE_PURCHASE_MODE_REQUIRED_FOR_UPFRONT_BUDGET: 'Will you buy the device monthly or pay upfront?',
  COMBINED_MONTHLY_BUDGET_EXCEEDED: 'Would you like to raise the combined monthly budget or consider a lower-cost device?',
  PLAN_PRICE_UNAVAILABLE_FOR_LINE_COUNT: 'Please choose a plan with a verified price for your number of lines.',
  PLAN_MAXIMUM_LINE_COUNT_EXCEEDED: 'This plan does not support the number of lines you need.',
};
const questionFor = (reason: string | undefined): string | undefined => questionsByReason[reason ?? ''];

function pickRecommendations(candidates: Candidate[]): Recommendation[] {
  if (candidates.length === 0) return [];
  const ordered = [...candidates].sort((a, b) => b.rankScore - a.rankScore || a.id.localeCompare(b.id));
  const chosen: Candidate[] = [ordered[0]];
  const cheapest = [...candidates].sort((a, b) => (a.estimatedMonthlyTotal ?? Infinity) - (b.estimatedMonthlyTotal ?? Infinity) || a.id.localeCompare(b.id)).find((item) => item.id !== chosen[0].id);
  if (cheapest) chosen.push(cheapest);
  const alternate = ordered.find((item) => !chosen.some((selected) => selected.id === item.id) && !chosen.some((selected) => selected.phoneId === item.phoneId || selected.planId === item.planId));
  if (alternate) chosen.push(alternate);
  return chosen.slice(0, 3).map((item, index) => ({ ...item, label: index === 0 ? 'best_match' : index === 1 ? 'lowest_cost' : 'alternative' }));
}

/** Deterministic, language-independent catalog ranking. */
export function recommend(preferencesInput: Preferences, catalog: Catalog): RecommendationResponse {
  const validation = validatePreferences(preferencesInput);
  if (!validation.valid) throw new Error(validation.error);
  const preferences = validation.value;
  const rejected = new Set<string>();
  const candidates: Candidate[] = [];
  for (const phone of [...catalog.phones].sort((a, b) => a.id.localeCompare(b.id))) for (const plan of [...catalog.plans].sort((a, b) => a.id.localeCompare(b.id))) {
    const cost = estimateCost(phone, plan, preferences);
    const eligibility = checkEligibility(phone, plan, preferences, cost);
    if (!eligibility.eligible) { rejected.add(eligibility.reason!); continue; }
    const score = scoreBundle(phone, plan, preferences, cost);
    const explanations = explanationCodes(phone, plan, preferences, cost);
    candidates.push({
      id: `${phone.id}__${plan.id}`,
      phoneId: phone.id,
      planId: plan.id,
      label: 'best_match',
      estimatedMonthlyTotal: cost.combinedMonthlyTotal,
      monthlyPlanPrice: cost.monthlyPlanPrice,
      estimatedMonthlyDeviceCost: cost.monthlyDeviceCost,
      currency: 'USD',
      reasons: explanations.reasons,
      tradeoffs: explanations.tradeoffs,
      assumptions: cost.assumptions,
      sourceUrls: [phone.sourceUrl, plan.sourceUrl].filter((value, index, values) => values.indexOf(value) === index),
      rankScore: score.total,
    });
  }
  const recommendations = pickRecommendations(candidates);
  const questions = [...rejected].sort().map(questionFor).filter((value): value is string => Boolean(value));
  const warnings: string[] = [];
  if (catalog.meta?.sourceDisclaimer) warnings.push(catalog.meta.sourceDisclaimer);
  if (preferences.budgetMonthlyTotal !== null && preferences.budgetIncludesDevice === false) warnings.push('BUDGET_APPLIES_TO_PLAN_ONLY_DEVICE_COST_SHOWN_SEPARATELY');
  if (recommendations.length === 0) warnings.push(rejected.has('COMBINED_MONTHLY_BUDGET_EXCEEDED') ? 'NO_VERIFIED_BUNDLE_MEETS_THE_COMBINED_MONTHLY_BUDGET' : 'NO_VERIFIED_BUNDLE_SATISFIES_THE_HARD_CONSTRAINTS');
  return { recommendations, catalogAsOf: catalog.asOf, warnings: [...new Set(warnings)].sort(), questions: [...new Set(questions)].sort() };
}
