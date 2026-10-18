import type { Preferences } from './types';

type Validation = { valid: true; value: Preferences } | { valid: false; error: string };
const keys = (value: object) => Object.keys(value).sort();
const sameKeys = (value: object, expected: string[]) => keys(value).join('|') === [...expected].sort().join('|');
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const nullableNumber = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);
const enumValue = (v: unknown, allowed: readonly string[]) => typeof v === 'string' && allowed.includes(v);

/** Rejects unknown fields so request shapes cannot silently drift from CONTRACTS.md. */
export function validatePreferences(input: unknown): Validation {
  if (!isObject(input) || !sameKeys(input, ['language', 'budgetMonthlyTotal', 'budgetIncludesDevice', 'maxDeviceUpfront', 'lines', 'devicePurchaseMode', 'newOrExistingCustomer', 'priorities', 'usage', 'accessibilityNeeds', 'eligibility'])) return { valid: false, error: 'Preferences must contain exactly the contract fields.' };
  if (!enumValue(input.language, ['en', 'es'])) return { valid: false, error: 'language must be en or es.' };
  if (!nullableNumber(input.budgetMonthlyTotal) || !nullableNumber(input.maxDeviceUpfront)) return { valid: false, error: 'Budget values must be non-negative numbers or null.' };
  if (!(input.budgetIncludesDevice === true || input.budgetIncludesDevice === false || input.budgetIncludesDevice === null)) return { valid: false, error: 'budgetIncludesDevice must be boolean or null.' };
  if (!(input.lines === null || (typeof input.lines === 'number' && Number.isInteger(input.lines) && input.lines > 0))) return { valid: false, error: 'lines must be a positive integer or null.' };
  if (!enumValue(input.devicePurchaseMode, ['monthly', 'upfront', 'unknown']) || !enumValue(input.newOrExistingCustomer, ['new', 'existing', 'unknown'])) return { valid: false, error: 'Invalid purchase mode or customer status.' };
  if (!Array.isArray(input.usage) || !input.usage.every((v) => typeof v === 'string') || !Array.isArray(input.accessibilityNeeds) || !input.accessibilityNeeds.every((v) => typeof v === 'string')) return { valid: false, error: 'usage and accessibilityNeeds must be string arrays.' };
  if (!isObject(input.priorities) || !sameKeys(input.priorities, ['camera', 'battery', 'displayReadability', 'simplicity', 'hotspot'])) return { valid: false, error: 'priorities must contain exactly the contract fields.' };
  if (!Object.values(input.priorities).every((v) => v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5))) return { valid: false, error: 'Priorities must be integers from 1 to 5 or null.' };
  if (!isObject(input.eligibility) || !sameKeys(input.eligibility, ['age55Plus']) || !enumValue(input.eligibility.age55Plus, ['yes', 'no', 'unknown'])) return { valid: false, error: 'Invalid eligibility.' };
  return { valid: true, value: input as Preferences };
}
