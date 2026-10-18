import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCatalog } from '../../src/data/catalog-loader';
import type { Catalog as AuditedCatalog } from '../../src/data/catalog-types';
import { recommend } from '../../src/recommendations';
import type { Preferences } from '../../src/recommendations';

/**
 * Compile-time integration guard: the data owner's authoritative Catalog can
 * be supplied to the engine without a copied catalog or runtime adapter.
 */
type Expect<T extends true> = T;
type AuditedCatalogIsAcceptedByEngine = AuditedCatalog extends Parameters<typeof recommend>[1] ? true : false;

export type _CatalogCompatibility = Expect<AuditedCatalogIsAcceptedByEngine>;

const preferences: Preferences = {
  language: 'en',
  budgetMonthlyTotal: null,
  budgetIncludesDevice: null,
  maxDeviceUpfront: null,
  lines: 1,
  devicePurchaseMode: 'monthly',
  newOrExistingCustomer: 'unknown',
  priorities: { camera: null, battery: null, displayReadability: null, simplicity: null, hotspot: null },
  usage: [],
  accessibilityNeeds: [],
  eligibility: { age55Plus: 'no' },
};

test('the audited offline catalog loads and feeds the recommendation engine', () => {
  const catalog = loadCatalog();
  const result = recommend(preferences, catalog);
  assert.equal(result.catalogAsOf, catalog.asOf);
  assert.ok(result.warnings.includes(catalog.meta.sourceDisclaimer));
  const phoneIds = new Set(catalog.phones.map((phone) => phone.id));
  const planIds = new Set(catalog.plans.map((plan) => plan.id));
  assert.ok(result.recommendations.every((item) => phoneIds.has(item.phoneId) && planIds.has(item.planId)));
});
