import assert from 'node:assert/strict';
import { loadCatalog } from './catalog-loader';
import { validateCatalog, validatePhoneRecord, validatePlanRecord } from './catalog-validator';
import type { PhoneRecord, PlanRecord } from './catalog-types';

console.log('--- Testing Catalog Loader & Real Dataset ---');
const catalog = loadCatalog();
assert.equal(catalog.asOf, '2026-10-17');
assert.equal(catalog.phones.length, 6, 'Must have exactly 6 verified phones in 6-phone catalog');
assert.equal(catalog.plans.length, 3, 'Must have exactly 3 verified plans in 3-plan catalog');

const validation = validateCatalog(catalog);
assert.equal(validation.valid, true, `Validation failed: ${validation.errors.join(', ')}`);
assert.equal(validation.errors.length, 0);
console.log('✓ 6-phone and 3-plan catalog loads and validates with 0 errors.');

console.log('--- Testing Validator Constraints ---');

// Test 1: Duplicate phone ID
const duplicatePhone: PhoneRecord = { ...catalog.phones[0] };
const dupRes = validatePhoneRecord(duplicatePhone, 1, new Set([duplicatePhone.id]));
assert.ok(dupRes.errors.some(e => e.includes('duplicate id')), 'Must detect duplicate phone id');
console.log('✓ Duplicate phone ID detected.');

// Test 2: Missing name
const missingNamePhone: PhoneRecord = { ...catalog.phones[0], name: '' };
const nameRes = validatePhoneRecord(missingNamePhone, 0, new Set());
assert.ok(nameRes.errors.some(e => e.includes('missing or empty \'name\'')), 'Must detect missing name');
console.log('✓ Missing phone name detected.');

// Test 3: Invalid negative price
const negativePricePhone: PhoneRecord = { ...catalog.phones[0], listPrice: -100 };
const priceRes = validatePhoneRecord(negativePricePhone, 0, new Set());
assert.ok(priceRes.errors.some(e => e.includes('invalid listPrice')), 'Must detect negative price');
console.log('✓ Negative phone price detected.');

// Test 4: Invalid financing term
const invalidFinancingPhone: PhoneRecord = { ...catalog.phones[0], financingMonths: 0 };
const finRes = validatePhoneRecord(invalidFinancingPhone, 0, new Set());
assert.ok(finRes.errors.some(e => e.includes('invalid financingMonths')), 'Must detect invalid financing term');
console.log('✓ Invalid financing term detected.');

// Test 5: Invalid feature score (> 5 or < 1)
const invalidScorePhone: PhoneRecord = {
  ...catalog.phones[0],
  scores: { ...catalog.phones[0].scores, camera: 6 }
};
const scoreRes = validatePhoneRecord(invalidScorePhone, 0, new Set());
assert.ok(scoreRes.errors.some(e => e.includes('invalid score')), 'Must detect score > 5');
console.log('✓ Invalid feature score detected.');

// Test 6: Invalid source URL
const invalidUrlPhone: PhoneRecord = { ...catalog.phones[0], sourceUrl: 'ftp://invalid-url' };
const urlRes = validatePhoneRecord(invalidUrlPhone, 0, new Set());
assert.ok(urlRes.errors.some(e => e.includes('invalid sourceUrl')), 'Must detect invalid source URL');
console.log('✓ Invalid source URL detected.');

// Test 7: Missing verification date
const missingDatePhone: PhoneRecord = { ...catalog.phones[0], sourceCheckedAt: 'invalid-date' };
const dateRes = validatePhoneRecord(missingDatePhone, 0, new Set());
assert.ok(dateRes.errors.some(e => e.includes('invalid sourceCheckedAt')), 'Must detect invalid date');
console.log('✓ Invalid verification date detected.');

// Test 8: Duplicate plan ID
const dupPlan: PlanRecord = { ...catalog.plans[0] };
const dupPlanRes = validatePlanRecord(dupPlan, 1, new Set([dupPlan.id]));
assert.ok(dupPlanRes.errors.some(e => e.includes('duplicate id')), 'Must detect duplicate plan ID');
console.log('✓ Duplicate plan ID detected.');

// Test 9: Unsupported line count (e.g. non-positive or negative line price)
const invalidLinePlan: PlanRecord = {
  ...catalog.plans[0],
  monthlyPriceByLines: { "0": 50, "1": -20 }
};
const lineRes = validatePlanRecord(invalidLinePlan, 0, new Set());
assert.ok(lineRes.errors.some(e => e.includes('invalid line count key')), 'Must detect non-positive line count');
assert.ok(lineRes.errors.some(e => e.includes('invalid price')), 'Must detect negative line price');
console.log('✓ Invalid line count and negative price detected.');

// Test 10: Invalid eligibility metadata
const invalidEligibilityPlan: PlanRecord = {
  ...catalog.plans[0],
  restrictions: { age55Plus: 'yes' as unknown as boolean, customer: 'invalid_status' as unknown as 'new' }
};
const eligRes = validatePlanRecord(invalidEligibilityPlan, 0, new Set());
assert.ok(eligRes.errors.some(e => e.includes('restrictions.age55Plus must be boolean')), 'Must detect non-boolean age55Plus');
assert.ok(eligRes.errors.some(e => e.includes("restrictions.customer must be 'new' or 'existing'")), 'Must detect invalid customer restriction');
console.log('✓ Invalid eligibility metadata detected.');

console.log('\nAll 10 validation constraint tests passed successfully!');

