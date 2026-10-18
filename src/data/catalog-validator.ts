import type { Catalog, PhoneRecord, PlanRecord, ValidationResult } from './catalog-types';

const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validatePhoneRecord(phone: PhoneRecord, index: number, seenIds: Set<string>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `Phone[${index}] (${phone?.id || 'unknown'})`;

  if (!phone || typeof phone !== 'object') {
    return { errors: [`${prefix}: record is not an object`], warnings: [] };
  }

  // ID validation
  if (!phone.id || typeof phone.id !== 'string' || phone.id.trim() === '') {
    errors.push(`${prefix}: missing or empty 'id'`);
  } else {
    if (seenIds.has(phone.id)) {
      errors.push(`${prefix}: duplicate id '${phone.id}'`);
    }
    seenIds.add(phone.id);
  }

  // Name validation
  if (!phone.name || typeof phone.name !== 'string' || phone.name.trim() === '') {
    errors.push(`${prefix}: missing or empty 'name'`);
  }

  // Brand validation
  if (!phone.brand || typeof phone.brand !== 'string' || phone.brand.trim() === '') {
    errors.push(`${prefix}: missing or empty 'brand'`);
  }

  // List price validation
  if (phone.listPrice !== null) {
    if (typeof phone.listPrice !== 'number' || !Number.isFinite(phone.listPrice) || phone.listPrice < 0) {
      errors.push(`${prefix}: invalid listPrice '${phone.listPrice}'. Must be a non-negative number or null.`);
    }
  } else {
    warnings.push(`${prefix}: listPrice is null (unverified/unknown)`);
  }

  // Financing months validation
  if (phone.financingMonths !== null) {
    if (typeof phone.financingMonths !== 'number' || !Number.isInteger(phone.financingMonths) || phone.financingMonths <= 0) {
      errors.push(`${prefix}: invalid financingMonths '${phone.financingMonths}'. Must be a positive integer or null.`);
    }
  } else {
    warnings.push(`${prefix}: financingMonths is null (device financing unavailable/unknown)`);
  }

  // Feature scores validation (1-5 integer or null)
  if (!phone.scores || typeof phone.scores !== 'object') {
    errors.push(`${prefix}: missing 'scores' object`);
  } else {
    const scoreKeys: (keyof PhoneRecord['scores'])[] = ['camera', 'battery', 'displayReadability', 'simplicity'];
    for (const key of scoreKeys) {
      const score = phone.scores[key];
      if (score !== null) {
        if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
          errors.push(`${prefix}: invalid score for '${key}': ${score}. Must be an integer between 1 and 5, or null.`);
        }
      }
    }
  }

  // Accessibility validation
  if (!phone.accessibility || typeof phone.accessibility !== 'object') {
    errors.push(`${prefix}: missing 'accessibility' object`);
  } else {
    const allowed: string[] = ['yes', 'no', 'unknown'];
    if (!allowed.includes(phone.accessibility.hearingCompatibility)) {
      errors.push(`${prefix}: accessibility.hearingCompatibility must be 'yes', 'no', or 'unknown' (got '${phone.accessibility.hearingCompatibility}')`);
    }
    if (!allowed.includes(phone.accessibility.largeTextFeatures)) {
      errors.push(`${prefix}: accessibility.largeTextFeatures must be 'yes', 'no', or 'unknown' (got '${phone.accessibility.largeTextFeatures}')`);
    }
  }

  // Source URL validation
  if (!phone.sourceUrl || typeof phone.sourceUrl !== 'string' || !URL_REGEX.test(phone.sourceUrl)) {
    errors.push(`${prefix}: invalid sourceUrl '${phone.sourceUrl}'`);
  }

  // Verification date validation
  if (!phone.sourceCheckedAt || typeof phone.sourceCheckedAt !== 'string' || !ISO_DATE_REGEX.test(phone.sourceCheckedAt)) {
    errors.push(`${prefix}: missing or invalid sourceCheckedAt date '${phone.sourceCheckedAt}' (expected YYYY-MM-DD)`);
  }

  return { errors, warnings };
}

export function validatePlanRecord(plan: PlanRecord, index: number, seenIds: Set<string>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `Plan[${index}] (${plan?.id || 'unknown'})`;

  if (!plan || typeof plan !== 'object') {
    return { errors: [`${prefix}: record is not an object`], warnings: [] };
  }

  // ID validation
  if (!plan.id || typeof plan.id !== 'string' || plan.id.trim() === '') {
    errors.push(`${prefix}: missing or empty 'id'`);
  } else {
    if (seenIds.has(plan.id)) {
      errors.push(`${prefix}: duplicate id '${plan.id}'`);
    }
    seenIds.add(plan.id);
  }

  // Name validation
  if (!plan.name || typeof plan.name !== 'string' || plan.name.trim() === '') {
    errors.push(`${prefix}: missing or empty 'name'`);
  }

  // Monthly price by lines validation
  if (!plan.monthlyPriceByLines || typeof plan.monthlyPriceByLines !== 'object' || Array.isArray(plan.monthlyPriceByLines)) {
    errors.push(`${prefix}: 'monthlyPriceByLines' must be an object map of line counts to prices`);
  } else {
    const lineEntries = Object.entries(plan.monthlyPriceByLines);
    if (lineEntries.length === 0) {
      errors.push(`${prefix}: monthlyPriceByLines cannot be empty`);
    }
    for (const [lineKey, price] of lineEntries) {
      const lineCount = Number(lineKey);
      if (!Number.isInteger(lineCount) || lineCount <= 0) {
        errors.push(`${prefix}: invalid line count key '${lineKey}'. Must be a positive integer.`);
      }
      if (price !== null && price !== undefined) {
        if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
          errors.push(`${prefix}: invalid price '${price}' for ${lineKey} line(s). Must be non-negative number or null.`);
        }
      }
    }
  }

  // Undiscounted monthly price by lines validation (optional)
  if (plan.undiscountedMonthlyPriceByLines) {
    if (typeof plan.undiscountedMonthlyPriceByLines !== 'object' || Array.isArray(plan.undiscountedMonthlyPriceByLines)) {
      errors.push(`${prefix}: 'undiscountedMonthlyPriceByLines' must be an object map`);
    } else {
      for (const [lineKey, price] of Object.entries(plan.undiscountedMonthlyPriceByLines)) {
        const lineCount = Number(lineKey);
        if (!Number.isInteger(lineCount) || lineCount <= 0) {
          errors.push(`${prefix}: invalid undiscounted line count key '${lineKey}'`);
        }
        if (price !== null && price !== undefined) {
          if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
            errors.push(`${prefix}: invalid undiscounted price '${price}' for ${lineKey} line(s)`);
          }
        }
      }
    }
  }

  // AutoPay discount per line validation
  if (plan.autoPayDiscountPerLine !== undefined) {
    if (typeof plan.autoPayDiscountPerLine !== 'number' || !Number.isFinite(plan.autoPayDiscountPerLine) || plan.autoPayDiscountPerLine < 0) {
      errors.push(`${prefix}: invalid autoPayDiscountPerLine '${plan.autoPayDiscountPerLine}'. Must be a non-negative number.`);
    }
  }

  // Hotspot score validation
  if (plan.hotspotScore !== null) {
    if (typeof plan.hotspotScore !== 'number' || !Number.isInteger(plan.hotspotScore) || plan.hotspotScore < 1 || plan.hotspotScore > 5) {
      errors.push(`${prefix}: invalid hotspotScore '${plan.hotspotScore}'. Must be an integer between 1 and 5, or null.`);
    }
  }

  // Supports usage validation
  if (!Array.isArray(plan.supportsUsage) || !plan.supportsUsage.every((u) => typeof u === 'string')) {
    errors.push(`${prefix}: 'supportsUsage' must be an array of strings`);
  }

  // Restrictions validation
  if (plan.restrictions) {
    if (typeof plan.restrictions !== 'object') {
      errors.push(`${prefix}: 'restrictions' must be an object`);
    } else {
      if (plan.restrictions.age55Plus !== undefined && typeof plan.restrictions.age55Plus !== 'boolean') {
        errors.push(`${prefix}: restrictions.age55Plus must be boolean`);
      }
      if (plan.restrictions.customer !== undefined && !['new', 'existing'].includes(plan.restrictions.customer)) {
        errors.push(`${prefix}: restrictions.customer must be 'new' or 'existing'`);
      }
      if (plan.restrictions.maxLines !== undefined && (!Number.isInteger(plan.restrictions.maxLines) || plan.restrictions.maxLines <= 0)) {
        errors.push(`${prefix}: restrictions.maxLines must be a positive integer`);
      }
    }
  }

  // Source URL validation
  if (!plan.sourceUrl || typeof plan.sourceUrl !== 'string' || !URL_REGEX.test(plan.sourceUrl)) {
    errors.push(`${prefix}: invalid sourceUrl '${plan.sourceUrl}'`);
  }

  // Verification date validation
  if (!plan.sourceCheckedAt || typeof plan.sourceCheckedAt !== 'string' || !ISO_DATE_REGEX.test(plan.sourceCheckedAt)) {
    errors.push(`${prefix}: missing or invalid sourceCheckedAt date '${plan.sourceCheckedAt}' (expected YYYY-MM-DD)`);
  }

  return { errors, warnings };
}

export function validateCatalog(catalog: Catalog): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!catalog || typeof catalog !== 'object') {
    return { valid: false, errors: ['Catalog root is not an object'], warnings: [] };
  }

  if (!catalog.asOf || typeof catalog.asOf !== 'string' || !ISO_DATE_REGEX.test(catalog.asOf)) {
    errors.push(`Catalog missing or invalid 'asOf' timestamp '${catalog.asOf}'`);
  }

  if (!Array.isArray(catalog.phones)) {
    errors.push("Catalog 'phones' must be an array");
  } else {
    const seenPhoneIds = new Set<string>();
    catalog.phones.forEach((phone, idx) => {
      const res = validatePhoneRecord(phone, idx, seenPhoneIds);
      errors.push(...res.errors);
      warnings.push(...res.warnings);
    });
  }

  if (!Array.isArray(catalog.plans)) {
    errors.push("Catalog 'plans' must be an array");
  } else {
    const seenPlanIds = new Set<string>();
    catalog.plans.forEach((plan, idx) => {
      const res = validatePlanRecord(plan, idx, seenPlanIds);
      errors.push(...res.errors);
      warnings.push(...res.warnings);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
