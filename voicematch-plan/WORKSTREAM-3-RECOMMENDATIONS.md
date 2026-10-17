# Workstream 3 — Curated Catalog, Pricing, and Explainable Recommendations

**Owner:** Person 3. **Primary mission:** A trustworthy, small, tested recommendation engine that maps structured needs to ranked phone + plan bundles with clear sources and assumptions.

## Scope

Own approximately **12 phones and 5 T-Mobile plans** in source-linked JSON; validation; cost estimation; eligibility checks; deterministic ranking; reason/tradeoff codes; `POST /api/recommendations`; tests/fixtures. The catalog is illustrative but must not contain fabricated factual specs/prices. Verify official product/plan terms manually and log date accessed.

## Data selection strategy

Select a range of entry-level Android, midrange Android, flagship Android, entry-level iPhone and premium iPhone models that are genuinely offered by T-Mobile **at the time you collect data**. Avoid assuming devices from a planning example are currently stocked. Choose plans covering common single-line budgets and a conditional eligible plan only if you can document requirements. Include known complexities: number of lines, device payments, device discounts/credits, taxes/fees, autopay, age or military/first responder requirements, and activation/financing terms. If unverified, mark unknown and avoid a precise combined quote.

## Recommended data schema (may refine before hour 1 contract freeze)

```json
{
  "asOf": "2026-10-17",
  "phones": [
    {
      "id": "example-phone-id",
      "name": "Verified Product Name",
      "brand": "Brand",
      "listPrice": null,
      "financingMonths": null,
      "screenInches": null,
      "strengths": [],
      "tradeoffs": [],
      "accessibility": { "hearingCompatibility": "unknown", "largeTextFeatures": "unknown" },
      "sourceUrl": "https://www.t-mobile.com/",
      "sourceCheckedAt": "2026-10-17"
    }
  ],
  "plans": []
}
```

The above is a schema example **not** a ready-to-display product entry or proof of live pricing. All sourced facts must be reverified in actual catalog implementation. Keep derived ratings (e.g. camera 1–5) explicitly labeled as a team-defined heuristic, not an external review score.

## Algorithm

1. Validate `Preferences` input and distinguish unknown from false.
2. Enumerate valid phone + plan pairs for the relevant line count and purchase mode.
3. Enforce confirmed eligibility, hard device requirements and hard budget only if prices can be computed with documented assumptions.
4. Compute transparent, simple fit scores: e.g. cost 30%, accessibility/readability 25%, battery 15%, camera 10%, simplicity 10%, usage/hotspot 10%. Adjust for explicitly stated priorities; document weights and tests. **Unknown compatibility is never a confirmed positive.**
5. Diversify among top results to return 2–3 meaningfully different alternatives (best match, lowest cost, alternate strength), not three near-identical bundles.
6. Return stable reason/tradeoff **codes**, explicit assumptions, plan/device price components, catalog timestamp and source URLs.
7. When insufficient data or no eligible bundle fits, return an honest no-match result plus one useful question/suggested relaxation; don't secretly exceed user budget.

## Parallel AI agent split

1. **Data agent (writer):** owns `src/data/**`, collects and documents trusted carrier/phone data; quality-checks numbers and provenance.
2. **Ranking agent (writer):** owns `src/recommendations/**`, scoring, cost model, eligibility and endpoint logic; develops against fixtures while data agent curates.
3. **Test agent:** owns separate recommendation tests/fixtures, with no simultaneous writes to the same files as the ranking agent; verifies Spanish-language-independent scoring and no-results handling.

## Time plan

- **0–1h:** Freeze schema, data provenance, cost assumptions; share 2 seeded fixture records quickly.
- **1–4h:** Populate representative catalog; implement scoring/eligibility separately.
- **4–6h:** Endpoint + fixtures + response contract; ship mock and real data to frontend.
- **6–8h:** Integration with voice/typed preference actions; ensure 3 valid responses.
- **8–11h:** “Cheaper” rerank, explanation codes, no-match/conditional plan logic.
- **11–13h:** Audit price/source links/assumptions; fill catalog coverage gaps.
- **13–16h:** Freeze pricing, test demo scenarios, help pitch algorithm transparency.

## Acceptance tests

- Same structured preferences in `en` and `es` yield identical ranked IDs and costs.
- Decreasing confirmed total budget cannot silently return an over-budget bundle as eligible.
- Unknown eligibility cannot return a restricted plan as confirmed eligible.
- For `lines=1`, plan prices correspond to 1 line or are explicitly unavailable.
- Unknown price shows unavailable, not $0.
- The result has valid source URLs, timestamps, reason codes and tradeoffs.
- Three alternatives are genuinely distinct when data supports them; zero/one/two results are handled gracefully.
- All API outputs conform to `CONTRACTS.md`.

## Prompt to give your AI coding agent

> Implement Workstream 3 according to `README.md` and `CONTRACTS.md`. Own only data, recommendations and dedicated recommendation endpoint files. Curate a small source-linked catalog of real current T-Mobile offerings with an as-of date; never fabricate availability, promotion, or pricing. Build deterministic budget/eligibility filtering, scores, alternative selection and reason codes. Produce typed `RecommendationResponse`, English/Spanish-independent output and unit tests for tight budgets, unknown eligibility, changing priorities, line counts and missing prices. Report source assumptions and integration readiness.
