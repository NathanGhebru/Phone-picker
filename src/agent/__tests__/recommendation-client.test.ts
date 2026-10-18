import assert from "node:assert";
import { describe, it } from "node:test";
import {
  RecommendationClient,
  RecommendationClientError,
} from "../recommendation-client";
import {
  MOCK_FIXTURE_EN_RECOMMENDATIONS,
} from "../fixtures";
import { createInitialPreferences } from "../preference-state";

describe("Recommendation Client", () => {
  it("makes contract-compliant POST request with preferences body", async () => {
    let capturedBody = "";
    let capturedHeaders: HeadersInit | undefined = undefined;

    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedBody = String(init?.body);
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify(MOCK_FIXTURE_EN_RECOMMENDATIONS), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = new RecommendationClient({
      baseUrl: "https://api.voicematch.local",
      fetchFn: mockFetch as unknown as typeof fetch,
      enableLocalFallback: false,
    });

    const prefs = createInitialPreferences("en");
    prefs.lines = 1;
    prefs.budgetMonthlyTotal = 60;
    prefs.budgetIncludesDevice = true;

    const res = await client.getRecommendations(prefs);
    assert.strictEqual(res.recommendations.length, 3);
    assert.ok(capturedHeaders !== undefined);

    const parsed = JSON.parse(capturedBody);
    assert.deepStrictEqual(parsed, { preferences: prefs });
  });

  it("handles HTTP 400 with error details from backend", async () => {
    const mockFetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({ error: "Invalid lines count: must be >= 1" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    const client = new RecommendationClient({
      fetchFn: mockFetch as unknown as typeof fetch,
      enableLocalFallback: false,
    });

    const prefs = createInitialPreferences("en");
    await assert.rejects(
      async () => {
        await client.getRecommendations(prefs);
      },
      (err: unknown) => {
        assert.ok(err instanceof RecommendationClientError);
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes("Invalid lines count"));
        return true;
      }
    );
  });

  it("uses local fallback when network fails and fallback is enabled", async () => {
    const failingFetch = async (): Promise<Response> => {
      throw new Error("fetch failed (ECONNREFUSED)");
    };

    const client = new RecommendationClient({
      fetchFn: failingFetch as unknown as typeof fetch,
      enableLocalFallback: true,
    });

    const prefs = createInitialPreferences("en");
    prefs.lines = 1;
    prefs.budgetMonthlyTotal = 60;
    prefs.budgetIncludesDevice = true;

    const res = await client.getRecommendations(prefs);
    assert.ok(res.recommendations.length > 0);
  });

  it("returns honest empty result for impossibly low budget in fallback mode", async () => {
    const failingFetch = async (): Promise<Response> => {
      throw new Error("fetch failed");
    };

    const client = new RecommendationClient({
      fetchFn: failingFetch as unknown as typeof fetch,
      enableLocalFallback: true,
    });

    const prefs = createInitialPreferences("en");
    prefs.lines = 1;
    prefs.budgetMonthlyTotal = 10; // $10 is impossible for a phone + plan bundle
    prefs.budgetIncludesDevice = true;

    const res = await client.getRecommendations(prefs);
    assert.strictEqual(res.recommendations.length, 0);
    assert.ok(res.warnings[0].includes("No bundles meet"));
  });
});

