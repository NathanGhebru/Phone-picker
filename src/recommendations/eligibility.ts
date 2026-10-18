import type { CostEstimate, PhoneCatalogItem, PlanCatalogItem, Preferences } from './types';

export type EligibilityResult = { eligible: boolean; reason?: string };

export function checkEligibility(phone: PhoneCatalogItem, plan: PlanCatalogItem, preferences: Preferences, cost: CostEstimate): EligibilityResult {
  if (preferences.lines === null) return { eligible: false, reason: 'LINE_COUNT_REQUIRED' };
  if (preferences.maxDeviceUpfront !== null && preferences.devicePurchaseMode === 'unknown') return { eligible: false, reason: 'DEVICE_PURCHASE_MODE_REQUIRED_FOR_UPFRONT_BUDGET' };
  if (cost.monthlyPlanPrice === null) return { eligible: false, reason: 'PLAN_PRICE_UNAVAILABLE_FOR_LINE_COUNT' };
  if (preferences.devicePurchaseMode !== 'upfront' && cost.monthlyDeviceCost === null) return { eligible: false, reason: 'DEVICE_MONTHLY_PRICE_UNAVAILABLE' };
  if (plan.restrictions?.age55Plus && preferences.eligibility.age55Plus !== 'yes') return { eligible: false, reason: preferences.eligibility.age55Plus === 'unknown' ? 'AGE_55_PLUS_ELIGIBILITY_UNCONFIRMED' : 'AGE_55_PLUS_NOT_ELIGIBLE' };
  if (plan.restrictions?.customer && preferences.newOrExistingCustomer !== plan.restrictions.customer) return { eligible: false, reason: 'CUSTOMER_STATUS_NOT_ELIGIBLE' };
  if (preferences.maxDeviceUpfront !== null && cost.upfrontDeviceCost !== null && cost.upfrontDeviceCost > preferences.maxDeviceUpfront) return { eligible: false, reason: 'DEVICE_UPFRONT_BUDGET_EXCEEDED' };
  if (preferences.devicePurchaseMode === 'upfront' && phone.listPrice === null) return { eligible: false, reason: 'DEVICE_UPFRONT_PRICE_UNAVAILABLE' };
  if (preferences.budgetMonthlyTotal !== null) {
    if (preferences.budgetIncludesDevice === null) return { eligible: false, reason: 'BUDGET_SCOPE_UNCONFIRMED' };
    const priceToCheck = preferences.budgetIncludesDevice ? cost.combinedMonthlyTotal : cost.monthlyPlanPrice;
    if (priceToCheck === null) return { eligible: false, reason: 'MONTHLY_PRICE_UNAVAILABLE' };
    if (priceToCheck > preferences.budgetMonthlyTotal) return { eligible: false, reason: preferences.budgetIncludesDevice ? 'COMBINED_MONTHLY_BUDGET_EXCEEDED' : 'PLAN_MONTHLY_BUDGET_EXCEEDED' };
  }
  return { eligible: true };
}
