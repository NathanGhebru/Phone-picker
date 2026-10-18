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
}

export class RecommendationClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private enableLocalFallback: boolean;

  constructor(options: RecommendationClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.fetchFn = options.fetchFn ?? (typeof fetch !== "undefined" ? fetch.bind(globalThis) : (undefined as unknown as typeof fetch));
    this.enableLocalFallback = options.enableLocalFallback ?? true;
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

    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
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

      const data = (await response.json()) as RecommendationResponse;
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
