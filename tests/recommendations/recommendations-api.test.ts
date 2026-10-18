import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../../src/app/api/recommendations/route';
import { loadCatalog } from '../../src/data/catalog-loader';
import type { Preferences } from '../../src/shared/types';

const preferences = (): Preferences => ({
  language: 'en',
  budgetMonthlyTotal: 60,
  budgetIncludesDevice: true,
  maxDeviceUpfront: null,
  lines: 1,
  devicePurchaseMode: 'monthly',
  newOrExistingCustomer: 'unknown',
  priorities: { camera: null, battery: 3, displayReadability: 5, simplicity: null, hotspot: null },
  usage: ['streaming'],
  accessibilityNeeds: ['large_text'],
  eligibility: { age55Plus: 'no' },
});

function request(body: string): Request {
  return new Request('http://localhost/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function json(response: Response): Promise<Record<string, unknown>> {
  const payload: unknown = await response.json();
  assert.ok(isRecord(payload));
  return payload;
}

test('returns a canonical response for a valid request', async () => {
  const response = await POST(request(JSON.stringify({ preferences: preferences() })));
  const payload = await json(response);
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(payload).sort(), ['catalogAsOf', 'questions', 'recommendations', 'warnings']);
  assert.ok(Array.isArray(payload.recommendations));
});

test('rejects malformed JSON', async () => {
  const response = await POST(request('{'));
  const payload = await json(response);
  assert.equal(response.status, 400);
  assert.equal(typeof payload.error, 'string');
});

test('rejects a request without preferences', async () => {
  const response = await POST(request(JSON.stringify({})));
  assert.equal(response.status, 400);
});

test('rejects invalid preference fields', async () => {
  const response = await POST(request(JSON.stringify({ preferences: { ...preferences(), lines: 0 } })));
  const payload = await json(response);
  assert.equal(response.status, 400);
  assert.equal(typeof payload.error, 'string');
});

test('returns zero qualifying bundles for an impossible verified budget', async () => {
  const response = await POST(request(JSON.stringify({ preferences: { ...preferences(), budgetMonthlyTotal: 0 } })));
  const payload = await json(response);
  assert.equal(response.status, 200);
  assert.deepEqual(payload.recommendations, []);
  assert.ok(Array.isArray(payload.warnings) && payload.warnings.includes('NO_VERIFIED_BUNDLE_MEETS_THE_COMBINED_MONTHLY_BUDGET'));
});

test('does not return age-restricted plans for unknown 55+ eligibility', async () => {
  const response = await POST(request(JSON.stringify({ preferences: { ...preferences(), eligibility: { age55Plus: 'unknown' } } })));
  const payload = await json(response);
  const catalog = loadCatalog();
  const restrictedPlanIds = new Set(catalog.plans.filter((plan) => plan.restrictions?.age55Plus).map((plan) => plan.id));
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.recommendations));
  assert.ok(payload.recommendations.every((item) => isRecord(item) && typeof item.planId === 'string' && !restrictedPlanIds.has(item.planId)));
});

test('produces the same bundle IDs and costs in English and Spanish', async () => {
  const english = await json(await POST(request(JSON.stringify({ preferences: preferences() }))));
  const spanish = await json(await POST(request(JSON.stringify({ preferences: { ...preferences(), language: 'es' } }))));
  const bundles = (payload: Record<string, unknown>) => Array.isArray(payload.recommendations)
    ? payload.recommendations.map((item) => isRecord(item) ? [item.id, item.estimatedMonthlyTotal] : item)
    : [];
  assert.deepEqual(bundles(spanish), bundles(english));
});

test('returns IDs, source URLs, and timestamp from the verified catalog', async () => {
  const response = await POST(request(JSON.stringify({ preferences: preferences() })));
  const payload = await json(response);
  const catalog = loadCatalog();
  const phoneIds = new Set(catalog.phones.map((phone) => phone.id));
  const planIds = new Set(catalog.plans.map((plan) => plan.id));
  assert.equal(payload.catalogAsOf, catalog.asOf);
  assert.ok(Array.isArray(payload.recommendations));
  assert.ok(payload.recommendations.every((item) => isRecord(item)
    && typeof item.phoneId === 'string' && phoneIds.has(item.phoneId)
    && typeof item.planId === 'string' && planIds.has(item.planId)
    && Array.isArray(item.sourceUrls) && item.sourceUrls.every((url) => typeof url === 'string' && url.startsWith('https://'))));
});
