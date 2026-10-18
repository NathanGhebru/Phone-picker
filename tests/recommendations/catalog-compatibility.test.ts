import type { Catalog as AuditedCatalog } from '../../src/data/catalog-types';
import { recommend } from '../../src/recommendations';
import type { Preferences } from '../../src/recommendations';

/**
 * Compile-time integration guard: the data owner's authoritative Catalog can
 * be supplied to the engine without a copied catalog or runtime adapter.
 */
declare const catalog: AuditedCatalog;
declare const preferences: Preferences;

recommend(preferences, catalog);
