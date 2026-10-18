/** Synthetic fixtures only. They are deliberately not T-Mobile offers or prices. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { recommend, validatePreferences } from '../../src/recommendations';
import type { Catalog, Preferences } from '../../src/recommendations';

const catalog: Catalog = {
  asOf: 'TEST-ONLY-2026-10-17',
  phones: [
    { id: 'basic', name: 'Basic test phone', listPrice: 120, financingMonths: 24, sourceUrl: 'https://example.test/basic', sourceCheckedAt: '2026-10-17', scores: { camera: 1, battery: 2, displayReadability: 4, simplicity: 1 }, accessibility: { hearingCompatibility: 'unknown', largeTextFeatures: 'yes' }, strengths: [], tradeoffs: [] },
    { id: 'camera', name: 'Camera test phone', listPrice: 240, financingMonths: 24, sourceUrl: 'https://example.test/camera', sourceCheckedAt: '2026-10-17', scores: { camera: 5, battery: 3, displayReadability: 5, simplicity: 3 }, accessibility: { hearingCompatibility: 'unknown', largeTextFeatures: 'yes' }, strengths: [], tradeoffs: [] },
    { id: 'unknown-price', name: 'Unknown price', listPrice: null, financingMonths: null, sourceUrl: 'https://example.test/unknown', sourceCheckedAt: '2026-10-17', scores: { camera: 5, battery: 5, displayReadability: 5, simplicity: 5 }, accessibility: { hearingCompatibility: 'unknown', largeTextFeatures: 'unknown' }, strengths: [], tradeoffs: [] },
  ],
  plans: [
    { id: 'value', name: 'Value test plan', monthlyPriceByLines: { 1: 35, 2: 60 }, sourceUrl: 'https://example.test/value', sourceCheckedAt: '2026-10-17', hotspotScore: 3, supportsUsage: [] },
    { id: 'premium', name: 'Premium test plan', monthlyPriceByLines: { 1: 45, 2: 75 }, sourceUrl: 'https://example.test/premium', sourceCheckedAt: '2026-10-17', hotspotScore: 5, supportsUsage: ['streaming'] },
    { id: 'senior', name: '55+ test plan', monthlyPriceByLines: { 1: 30 }, sourceUrl: 'https://example.test/senior', sourceCheckedAt: '2026-10-17', hotspotScore: 4, supportsUsage: [], restrictions: { age55Plus: true } },
    { id: 'missing', name: 'Missing price plan', monthlyPriceByLines: { 2: 50 }, sourceUrl: 'https://example.test/missing', sourceCheckedAt: '2026-10-17', hotspotScore: 5, supportsUsage: [] },
  ],
};
const base = (): Preferences => ({ language: 'en', budgetMonthlyTotal: 60, budgetIncludesDevice: true, maxDeviceUpfront: null, lines: 1, devicePurchaseMode: 'monthly', newOrExistingCustomer: 'unknown', priorities: { camera: null, battery: 3, displayReadability: 5, simplicity: null, hotspot: null }, usage: ['streaming'], accessibilityNeeds: ['large_text'], eligibility: { age55Plus: 'no' } });

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
