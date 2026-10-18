import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Catalog, CatalogMeta, PhoneRecord, PlanRecord } from './catalog-types.ts';
import { validateCatalog } from './catalog-validator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJsonFile<T>(filename: string): T {
  const filePath = path.join(__dirname, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

/**
 * Loads the static, verified T-Mobile catalog offline.
 * Enforces schema validation before returning.
 * Throws an Error if catalog fails critical validation.
 */
export function loadCatalog(options?: { skipValidation?: boolean }): Catalog {
  const meta = readJsonFile<CatalogMeta>('catalog-meta.json');
  const phones = readJsonFile<PhoneRecord[]>('phones.json');
  const plans = readJsonFile<PlanRecord[]>('plans.json');

  const catalog: Catalog = {
    asOf: meta.asOf,
    meta,
    phones,
    plans,
  };

  if (!options?.skipValidation) {
    const validation = validateCatalog(catalog);
    if (!validation.valid) {
      throw new Error(`Catalog validation failed with ${validation.errors.length} error(s):\n${validation.errors.join('\n')}`);
    }
  }

  return catalog;
}

export function getPhones(): PhoneRecord[] {
  return loadCatalog().phones;
}

export function getPlans(): PlanRecord[] {
  return loadCatalog().plans;
}

export function getPhoneById(id: string): PhoneRecord | undefined {
  return getPhones().find((p) => p.id === id);
}

export function getPlanById(id: string): PlanRecord | undefined {
  return getPlans().find((p) => p.id === id);
}
