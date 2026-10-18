/** Synthetic fixtures only. They are deliberately not T-Mobile offers or prices. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { recommend, validatePreferences } from '../../src/recommendations';
import type { Catalog, Preferences } from '../../src/recommendations';

const catalog: Catalog = {
  asOf: 'TEST-ONLY-2026-10-17',
  meta: { sourceDisclaimer: 'TEST: taxes, fees, and connection charges are excluded.' },
  phones: [
    { id: 'basic', name: 'Basic test phone', listPrice: 120, financingMonths: 24, sourceUrl: 'https://example.test/basic', sourceCheckedAt: '2026-10-17', scores: { camera: 1, battery: 2, displayReadability: 4, simplicity: 1 }, accessibility: { hearingCompatibility: 'unknown', largeTextFeatures: 'yes' }, strengths: [], tradeoffs: [] },
    { id: 'camera', name: 'Camera test phone', listPrice: 240, financingMonths: 24, sourceUrl: 'https://example.test/camera', sourceCheckedAt: '2026-10-17', scores: { camera: 5, battery: 3, displayReadability: 5, simplicity: 3 }, accessibility: { hearingCompatibility: 'unknown', largeTextFeatures: 'yes' }, strengths: [], tradeoffs: [] },
    { id: 'unknown-price', name: 'Unknown price', listPrice: null, financingMonths: null, sourceUrl: 'https://example.test/unknown', sourceCheckedAt: '2026-10-17', scores: { camera: 5, battery: 5, displayReadability: 5, simplicity: 5 }, accessibility: { hearingCompatibility: 'unknown', largeTextFeatures: 'unknown' }, strengths: [], tradeoffs: [] },
  ],
  plans: [
    { id: 'value', name: 'Value test plan', monthlyPriceByLines: { 1: 35, 2: 60 }, autoPayAssumptions: 'TEST: price already includes eligible AutoPay; do not subtract another discount.', taxAndFeeAssumptions: 'TEST: taxes and fees are excluded from this base price.', sourceUrl: 'https://example.test/value', sourceCheckedAt: '2026-10-17', hotspotScore: 3, supportsUsage: [], restrictions: { maxLines: 2 } },
    { id: 'premium', name: 'Premium test plan', monthlyPriceByLines: { 1: 45, 2: 75 }, sourceUrl: 'https://example.test/premium', sourceCheckedAt: '2026-10-17', hotspotScore: 5, supportsUsage: ['streaming'] },
    { id: 'senior', name: '55+ test plan', monthlyPriceByLines: { 1: 30 }, sourceUrl: 'https://example.test/senior', sourceCheckedAt: '2026-10-17', hotspotScore: 4, supportsUsage: [], restrictions: { age55Plus: true } },
    { id: 'missing', name: 'Missing price plan', monthlyPriceByLines: { 2: 50 }, sourceUrl: 'https://example.test/missing', sourceCheckedAt: '2026-10-17', hotspotScore: 5, supportsUsage: [] },
  ],
};
const base = (): Preferences => ({ language: 'en', budgetMonthlyTotal: 60, budgetIncludesDevice: true, maxDeviceUpfront: null, lines: 1, devicePurchaseMode: 'monthly', newOrExistingCustomer: 'unknown', priorities: { camera: null, battery: 3, displayReadability: 5, simplicity: null, hotspot: null }, usage: ['streaming'], accessibilityNeeds: ['large_text'], eligibility: { age55Plus: 'no' } });

test('all JSON preference fixtures conform to the shared preference contract', () => {
  for (const filename of ['en-budget-parent.json', 'es-budget-parent.json', 'cheaper-update.json', 'unknown-eligibility.json', 'no-match.json']) {
    const fixture = JSON.parse(readFileSync(new URL(`./fixtures/${filename}`, import.meta.url), 'utf8'));
    assert.equal(validatePreferences(fixture).valid, true, filename);
  }
});

test('a $60 confirmed combined budget returns only affordable, priced bundles', () => {
  const result = recommend(base(), catalog);
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.recommendations.every((r) => r.estimatedMonthlyTotal !== null && r.estimatedMonthlyTotal <= 60));
});
test('reduced budget reranks to the cheaper bundle', () => {
  const normal = recommend(base(), catalog);
  const cheaper = recommend({ ...base(), budgetMonthlyTotal: 42 }, catalog);
  assert.notEqual(normal.recommendations[0]?.id, cheaper.recommendations[0]?.id);
});
test('unknown 55+ eligibility excludes the restricted plan', () => {
  const result = recommend({ ...base(), eligibility: { age55Plus: 'unknown' } }, catalog);
  assert.ok(result.recommendations.every((r) => r.planId !== 'senior'));
});
test('uses exact single-line and multi-line prices', () => {
  assert.equal(recommend(base(), catalog).recommendations.find((r) => r.planId === 'value')?.monthlyPlanPrice, 35);
  assert.equal(recommend({ ...base(), lines: 2, budgetMonthlyTotal: 80 }, catalog).recommendations.find((r) => r.planId === 'value')?.monthlyPlanPrice, 60);
});
test('missing prices are never treated as zero', () => {
  const result = recommend(base(), catalog);
  assert.ok(result.recommendations.every((r) => r.phoneId !== 'unknown-price' && r.planId !== 'missing'));
});
test('monthly installments require a verified positive financing term', () => {
  const withUnknownFinancing: Catalog = { ...catalog, phones: [{ ...catalog.phones[0], financingMonths: null }, ...catalog.phones.slice(1)] };
  const result = recommend(base(), withUnknownFinancing);
  assert.ok(result.recommendations.every((r) => r.phoneId !== 'basic'));
});
test('preserves AutoPay and tax assumptions without applying an additional discount', () => {
  const result = recommend(base(), catalog);
  const value = result.recommendations.find((r) => r.planId === 'value');
  assert.equal(value?.monthlyPlanPrice, 35);
  assert.ok(value?.assumptions.includes('TEST: price already includes eligible AutoPay; do not subtract another discount.'));
  assert.ok(value?.assumptions.includes('TEST: taxes and fees are excluded from this base price.'));
  assert.ok(result.warnings.includes('TEST: taxes, fees, and connection charges are excluded.'));
});
test('plan max-lines restrictions are enforced even when a price is present', () => {
  const threeLines = recommend({ ...base(), lines: 3, budgetMonthlyTotal: 200 }, { ...catalog, plans: [{ ...catalog.plans[0], monthlyPriceByLines: { 1: 35, 2: 60, 3: 80 } }] });
  assert.equal(threeLines.recommendations.length, 0);
  assert.ok(threeLines.questions.some((q) => q.includes('does not support')));
});
test('unknown budget scope asks rather than claiming affordability', () => {
  const result = recommend({ ...base(), budgetIncludesDevice: null }, catalog);
  assert.equal(result.recommendations.length, 0);
  assert.ok(result.questions.some((q) => q.includes('include the phone')));
});
test('invalid nested fields and unknown fields are rejected', () => {
  assert.equal(validatePreferences({ ...base(), unexpected: true }).valid, false);
  assert.equal(validatePreferences({ ...base(), priorities: { ...base().priorities, battery: 6 } }).valid, false);
});
test('an impossible budget has a useful zero-result warning', () => {
  const result = recommend({ ...base(), budgetMonthlyTotal: 10 }, catalog);
  assert.equal(result.recommendations.length, 0);
  assert.ok(result.warnings.includes('NO_VERIFIED_BUNDLE_MEETS_THE_COMBINED_MONTHLY_BUDGET'));
});
test('language does not change ranking or cost', () => {
  const en = recommend(base(), catalog);
  const es = recommend({ ...base(), language: 'es' }, catalog);
  assert.deepEqual(es.recommendations.map((r) => [r.id, r.estimatedMonthlyTotal]), en.recommendations.map((r) => [r.id, r.estimatedMonthlyTotal]));
});
test('ordering is stable and alternatives are distinct', () => {
  const one = recommend(base(), catalog);
  const two = recommend(base(), catalog);
  assert.deepEqual(one.recommendations, two.recommendations);
  assert.equal(new Set(one.recommendations.map((r) => r.id)).size, one.recommendations.length);
});
