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

console.log('--- Testing Go5G Multi-Line & Family Plan Verification ---');
const go5g = catalog.plans.find((p) => p.id === 'tmobile-go5g');
assert.ok(go5g, 'Go5G plan must be present in catalog');

// Verify 1 through 5 lines are defined and accurately priced
assert.equal(go5g.monthlyPriceByLines[1], 75.0, 'Go5G line 1 must be $75');
assert.equal(go5g.monthlyPriceByLines[2], 130.0, 'Go5G line 2 must be $130');
assert.equal(go5g.monthlyPriceByLines[3], 155.0, 'Go5G line 3 standard non-promo must be $155');
assert.equal(go5g.monthlyPriceByLines[4], 180.0, 'Go5G line 4 standard non-promo must be $180');
assert.equal(go5g.monthlyPriceByLines[5], 205.0, 'Go5G line 5 standard non-promo must be $205');

// Verify undiscounted prices
assert.ok(go5g.undiscountedMonthlyPriceByLines, 'Go5G must have undiscounted monthly prices');
assert.equal(go5g.undiscountedMonthlyPriceByLines[1], 80.0, 'Go5G undiscounted line 1 must be $80');
assert.equal(go5g.undiscountedMonthlyPriceByLines[2], 140.0, 'Go5G undiscounted line 2 must be $140');
assert.equal(go5g.undiscountedMonthlyPriceByLines[3], 170.0, 'Go5G undiscounted line 3 must be $170');
assert.equal(go5g.undiscountedMonthlyPriceByLines[4], 200.0, 'Go5G undiscounted line 4 must be $200');
assert.equal(go5g.undiscountedMonthlyPriceByLines[5], 230.0, 'Go5G undiscounted line 5 must be $230');

// Verify AutoPay math consistency: undiscounted - discounted === lineCount * autoPayDiscountPerLine
const autoPayDiscount = go5g.autoPayDiscountPerLine ?? 5.0;
for (let lines = 1; lines <= 5; lines++) {
  const discounted: number | null | undefined = go5g.monthlyPriceByLines[lines];
  const undiscounted: number | null | undefined = go5g.undiscountedMonthlyPriceByLines?.[lines];
  assert.ok(typeof discounted === 'number' && typeof undiscounted === 'number');
  const expectedDiff = lines * autoPayDiscount;
  assert.equal(undiscounted - discounted, expectedDiff, `AutoPay discount for ${lines} line(s) must be exactly $${expectedDiff}`);
}
console.log('✓ Go5G 1-5 line pricing and AutoPay arithmetic verified consistent.');

// Verify line caps on Essentials plans vs. Go5G
const essentialsSaver = catalog.plans.find((p) => p.id === 'tmobile-essentials-saver-2');
assert.ok(essentialsSaver);
assert.equal(essentialsSaver.restrictions?.maxLines, 2, 'Essentials Saver must be capped at 2 lines');
assert.equal(essentialsSaver.monthlyPriceByLines[3], undefined, 'Essentials Saver must not have 3-line pricing');

const essentials55 = catalog.plans.find((p) => p.id === 'tmobile-essentials-choice-55-2');
assert.ok(essentials55);
assert.equal(essentials55.restrictions?.maxLines, 2, 'Essentials 55 must be capped at 2 lines');
assert.equal(essentials55.monthlyPriceByLines[3], undefined, 'Essentials 55 must not have 3-line pricing');
console.log('✓ Essentials line limits strictly enforced; Go5G multi-line family support verified.');

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

