/**
 * Local engine boundary. This intentionally mirrors CONTRACTS.md without
 * replacing src/shared/types.ts, which will be supplied by the app scaffold.
 */
export type Language = 'en' | 'es';
export type Eligibility = 'yes' | 'no' | 'unknown';
export type Priority = 1 | 2 | 3 | 4 | 5;

export type Preferences = {
  language: Language;
  budgetMonthlyTotal: number | null;
  budgetIncludesDevice: boolean | null;
  maxDeviceUpfront: number | null;
  lines: number | null;
  devicePurchaseMode: 'monthly' | 'upfront' | 'unknown';
  newOrExistingCustomer: 'new' | 'existing' | 'unknown';
  priorities: {
    camera: Priority | null;
    battery: Priority | null;
    displayReadability: Priority | null;
    simplicity: Priority | null;
    hotspot: Priority | null;
  };
  usage: string[];
  accessibilityNeeds: string[];
  eligibility: { age55Plus: Eligibility };
};

export type Recommendation = {
  id: string;
  phoneId: string;
  planId: string;
  label: 'best_match' | 'lowest_cost' | 'alternative';
  estimatedMonthlyTotal: number | null;
  monthlyPlanPrice: number | null;
  estimatedMonthlyDeviceCost: number | null;
  currency: 'USD';
  reasons: string[];
  tradeoffs: string[];
  assumptions: string[];
  sourceUrls: string[];
  rankScore: number;
};

export type RecommendationResponse = {
  recommendations: Recommendation[];
  catalogAsOf: string;
  warnings: string[];
  questions: string[];
};

/** Catalog adapter expected from the catalog owner; amounts are USD. */
export type PhoneCatalogItem = {
  id: string;
  name: string;
  listPrice: number | null;
  financingMonths: number | null;
  sourceUrl: string;
  sourceCheckedAt: string;
  scores: { camera: number | null; battery: number | null; displayReadability: number | null; simplicity: number | null };
  accessibility: { hearingCompatibility: 'yes' | 'no' | 'unknown'; largeTextFeatures: 'yes' | 'no' | 'unknown' };
  strengths: string[];
  tradeoffs: string[];
};

export type PlanCatalogItem = {
  id: string;
  name: string;
  /** Exact verified base monthly price keyed by total line count. Missing is unavailable, never zero. */
  monthlyPriceByLines: Record<number, number | null | undefined>;
  sourceUrl: string;
  sourceCheckedAt: string;
  hotspotScore: number | null;
  supportsUsage: string[];
  restrictions?: { age55Plus?: boolean; customer?: 'new' | 'existing' };
};

export type Catalog = { asOf: string; phones: PhoneCatalogItem[]; plans: PlanCatalogItem[] };

export type CostEstimate = {
  monthlyPlanPrice: number | null;
  monthlyDeviceCost: number | null;
  combinedMonthlyTotal: number | null;
  upfrontDeviceCost: number | null;
  assumptions: string[];
};
