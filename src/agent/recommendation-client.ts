import type {
  Preferences,
  RecommendationResponse,
} from "../shared/types";
import {
  MOCK_FIXTURE_EN_RECOMMENDATIONS,
  MOCK_FIXTURE_NO_MATCH_RESPONSE,
} from "./fixtures";

export class RecommendationClientError extends Error {
  public status?: number;
  public details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "RecommendationClientError";
    this.status = status;
    this.details = details;
  }
}

export interface RecommendationClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  enableLocalFallback?: boolean;
  timeoutMs?: number;
}

function isRecommendationResponse(value: unknown): value is RecommendationResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const strings = (items: unknown): items is string[] =>
    Array.isArray(items) && items.every((item) => typeof item === "string");
  const price = (amount: unknown) => amount === null ||
    (typeof amount === "number" && Number.isFinite(amount) && amount >= 0);
  return typeof data.catalogAsOf === "string" && strings(data.warnings) &&
    strings(data.questions) && Array.isArray(data.recommendations) &&
    data.recommendations.every((item: unknown) => {
      if (!item || typeof item !== "object") return false;
      const rec = item as Record<string, unknown>;
      return [rec.id, rec.phoneId, rec.planId].every((id) => typeof id === "string" && id.length > 0) &&
        ["best_match", "lowest_cost", "alternative"].includes(String(rec.label)) &&
        rec.currency === "USD" && price(rec.estimatedMonthlyTotal) &&
        price(rec.monthlyPlanPrice) && price(rec.estimatedMonthlyDeviceCost) &&
        typeof rec.rankScore === "number" && Number.isFinite(rec.rankScore) &&
        strings(rec.reasons) && strings(rec.tradeoffs) && strings(rec.assumptions) && strings(rec.sourceUrls);
    });
}

export class RecommendationClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private enableLocalFallback: boolean;
  private timeoutMs: number;

  constructor(options: RecommendationClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.fetchFn = options.fetchFn ?? (typeof fetch !== "undefined" ? fetch.bind(globalThis) : (undefined as unknown as typeof fetch));
    
    // In production, fallback must be explicitly requested and defaults to false
    // to prevent silently substituting fixture products when Person 3's real API is unreachable.
    const isProduction =
      typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "production";

    this.enableLocalFallback = options.enableLocalFallback ?? (isProduction ? false : false);
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  /**
   * Invokes POST /api/recommendations strictly per CONTRACTS.md:
   * Request body: { preferences: Preferences }
   * Response: RecommendationResponse
   */
  async getRecommendations(preferences: Preferences): Promise<RecommendationResponse> {
    const url = `${this.baseUrl}/api/recommendations`;
    const payload = { preferences };

    if (!this.fetchFn) {
      if (this.enableLocalFallback) {
        return this.generateMockResponse(preferences);
      }
      throw new RecommendationClientError("No fetch implementation available.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBody: { error?: string } = {};
        try {
          errorBody = await response.json();
        } catch {
          // ignore json parse error
        }
        throw new RecommendationClientError(
          errorBody.error || `Recommendation API returned HTTP ${response.status}`,
          response.status,
          errorBody
        );
      }

      const data: unknown = await response.json();
      if (!isRecommendationResponse(data)) {
        throw new RecommendationClientError("Recommendation service returned an invalid response.");
      }
      return data;
    } catch (err: unknown) {
      if (err instanceof RecommendationClientError) {
        throw err;
      }

      // If network fails (e.g. backend server route not yet running during early dev),
      // allow mock fallback if enabled so demo flows don't crash.
      if (this.enableLocalFallback) {
        return this.generateMockResponse(preferences);
      }

      const msg = err instanceof Error ? err.message : String(err);
      throw new RecommendationClientError(`Failed to reach recommendation service: ${msg}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Provides contract-compliant fallback data when the backend endpoint is not yet mounted.
   */
  private generateMockResponse(preferences: Preferences): RecommendationResponse {
    // If budget is impossibly low (e.g. < $25 for total monthly bundle), return honest empty response
    if (
      preferences.budgetMonthlyTotal !== null &&
      preferences.budgetMonthlyTotal < 25 &&
      preferences.budgetIncludesDevice === true
    ) {
      return {
        ...MOCK_FIXTURE_NO_MATCH_RESPONSE,
        warnings: [
          `No bundles meet your total monthly budget of $${preferences.budgetMonthlyTotal}. Standard plans start around $50/month.`,
        ],
      };
    }

    return MOCK_FIXTURE_EN_RECOMMENDATIONS;
  }
}
