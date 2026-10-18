/**
 * VoiceMatch - Verified T-Mobile Phone & Plan Catalog Types
 * 
 * Authoritative types for the curated catalog dataset (Person 3 - Data Workstream).
 * Designed for offline deterministic recommendation consumption.
 */

export type AccessibilityStatus = 'yes' | 'no' | 'unknown';

/**
 * Subjective heuristics evaluated on a 1-5 integer scale by the VoiceMatch team.
 * Explicitly labeled as internal team heuristics, NOT official manufacturer or third-party ratings.
 */
export type FeatureScores = {
  camera: number | null;
  battery: number | null;
  displayReadability: number | null;
  simplicity: number | null;
};

export type PhoneAccessibility = {
  hearingCompatibility: AccessibilityStatus;
  largeTextFeatures: AccessibilityStatus;
  screenReaderSupported?: AccessibilityStatus;
};

export type PhoneRecord = {
  /** Stable unique identifier (kebab-case) */
  id: string;
  /** Official marketing name */
  name: string;
  /** Brand / manufacturer */
  brand: string;
  /** Verified full retail price (USD), or null if unverified */
  listPrice: number | null;
  /** Standard verified financing term in months (e.g. 24 or 36), or null if financing unverified */
  financingMonths: number | null;
  /** Diagonal screen size in inches, or null */
  screenInches: number | null;
  /** Battery capacity in mAh, or null */
  batteryCapacityMah: number | null;
  /** Plain-language battery overview */
  batteryInfo: string | null;
  /** Plain-language camera description */
  cameraInfo: string | null;
  /** Plain-language display & readability description */
  displayInfo: string | null;
  /** Internal 1-5 ranking heuristics */
  scores: FeatureScores;
  /** Verified accessibility capabilities */
  accessibility: PhoneAccessibility;
  /** Plain-language key strengths */
  strengths: string[];
  /** Plain-language tradeoffs or limitations */
  tradeoffs: string[];
  /** Official carrier or manufacturer source URL */
  sourceUrl: string;
  /** ISO date string when information was verified */
  sourceCheckedAt: string;
};

export type PlanRestrictions = {
  /** Whether the plan requires age 55+ eligibility */
  age55Plus?: boolean;
  /** Restriction by customer relationship (new vs existing) */
  customer?: 'new' | 'existing';
  /** Maximum number of voice lines allowed under this plan */
  maxLines?: number;
};

export type PlanRecord = {
  /** Stable unique identifier (kebab-case) */
  id: string;
  /** Official plan name */
  name: string;
  /**
   * Exact verified base monthly price in USD keyed by total line count.
   * Missing lines must be null or undefined, NEVER zero.
   * Never substitute multi-line per-line price for single line.
   */
  monthlyPriceByLines: Record<number, number | null | undefined>;
  /** Optional undiscounted base monthly prices (before AutoPay discount) */
  undiscountedMonthlyPriceByLines?: Record<number, number | null | undefined>;
  /** AutoPay discount amount in USD per line (typically $5) */
  autoPayDiscountPerLine?: number;
  /** Specific AutoPay discount terms and billing payment method requirements */
  autoPayAssumptions: string;
  /** Clarification on whether taxes and regulatory fees are included */
  taxAndFeeAssumptions: string;
  /** Internal 1-5 heuristic score for hotspot/data performance */
  hotspotScore: number | null;
  /** Tagged usage types supported well by this plan */
  supportsUsage: string[];
  /** Plan eligibility and account limitations */
  restrictions?: PlanRestrictions;
  /** Specific data, streaming, and hotspot allowances */
  dataAndHotspotFeatures: string[];
  /** Bullet points detailing required customer eligibility */
  eligibilityCriteria: string[];
  /** Official T-Mobile source URL */
  sourceUrl: string;
  /** ISO date string when plan pricing and terms were verified */
  sourceCheckedAt: string;
};

export type PricingConventions = {
  monthlyPriceByLinesType: 'advertised_autopay_discounted' | 'undiscounted';
  monthlyPriceByLinesExplanation: string;
  customerEligibility: string;
  autoPayConditions: string;
  taxesAndFeesExclusions: string;
};

export type CatalogMeta = {
  asOf: string;
  catalogVersion: string;
  pricingConventions?: PricingConventions;
  sourceDisclaimer: string;
  heuristicRatingDisclaimer: string;
};

export type Catalog = {
  asOf: string;
  meta: CatalogMeta;
  phones: PhoneRecord[];
  plans: PlanRecord[];
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

