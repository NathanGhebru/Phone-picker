import type { CostEstimate, PhoneCatalogItem, PlanCatalogItem, Preferences } from './types';

const money = (value: number) => Math.round(value * 100) / 100;

export function estimateCost(phone: PhoneCatalogItem, plan: PlanCatalogItem, preferences: Preferences): CostEstimate {
  const planPrice = preferences.lines === null ? null : plan.monthlyPriceByLines[preferences.lines] ?? null;
  const canFinance = phone.listPrice !== null && phone.financingMonths !== null && phone.financingMonths > 0;
  const monthlyDevice = preferences.devicePurchaseMode === 'upfront' ? 0 : canFinance ? money(phone.listPrice! / phone.financingMonths!) : null;
  const upfront = preferences.devicePurchaseMode === 'upfront' ? phone.listPrice : preferences.devicePurchaseMode === 'monthly' ? 0 : null;
  const assumptions: string[] = [];
  if (planPrice === null) assumptions.push('PLAN_PRICE_UNAVAILABLE_FOR_LINE_COUNT');
  else assumptions.push(`PLAN_PRICE_VERIFIED_FOR_${preferences.lines}_LINES`);
  if (preferences.devicePurchaseMode === 'monthly') assumptions.push(canFinance ? `DEVICE_FINANCED_OVER_${phone.financingMonths}_MONTHS` : 'DEVICE_FINANCING_UNAVAILABLE');
  if (preferences.devicePurchaseMode === 'unknown') assumptions.push('DEVICE_PURCHASE_MODE_UNKNOWN_MONTHLY_ESTIMATE_SHOWN_WHEN_AVAILABLE');
  if (preferences.devicePurchaseMode === 'upfront') assumptions.push('DEVICE_PURCHASED_UPFRONT');
  if (monthlyDevice !== null && preferences.devicePurchaseMode !== 'upfront') assumptions.push('DEVICE_PAYMENT_EXCLUDES_TAXES_FEES_PROMOTIONAL_CREDITS');
  return { monthlyPlanPrice: planPrice, monthlyDeviceCost: monthlyDevice, combinedMonthlyTotal: planPrice === null || monthlyDevice === null ? null : money(planPrice + monthlyDevice), upfrontDeviceCost: upfront, assumptions };
}
