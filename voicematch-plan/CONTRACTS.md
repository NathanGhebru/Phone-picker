# VoiceMatch — Shared Integration Contracts

**Read this before making code changes.** This file is the agreement between frontend, voice, and recommendation workstreams. One person approves edits to shared schemas before the three branches depend on them.

## Stack and module boundaries

Select **one** stack at kickoff: recommended **Next.js + TypeScript + API routes** for a single deployable app; React/Vite + small Node backend is also acceptable. Examples below use TypeScript-agnostic endpoint shapes. Keep `.env.example` committed, but never commit actual tokens.

- `src/components/`, `src/app/`, `src/i18n/` — frontend owner
- `src/voice/`, `src/agent/`, `src/app/api/voice/` — voice owner
- `src/data/`, `src/recommendations/`, `src/app/api/recommendations/` — recommendations owner
- `src/shared/types.ts` and this file — jointly approved; pick one human steward to edit
- `src/app/api/preferences/` (if needed) — voice owner; coordinate with frontend

## Core types

```ts
type Language = 'en' | 'es';
type Confidence = 'explicit' | 'inferred' | 'unknown';
type Eligibility = 'yes' | 'no' | 'unknown';
type Priority = 1 | 2 | 3 | 4 | 5;

type Preferences = {
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

type PreferenceUpdate = {
  patch: Partial<Preferences>;
  evidence?: string;
  source: 'voice' | 'text' | 'ui';
};

type Recommendation = {
  id: string;
  phoneId: string;
  planId: string;
  label: 'best_match' | 'lowest_cost' | 'alternative';
  estimatedMonthlyTotal: number | null;
  monthlyPlanPrice: number | null;
  estimatedMonthlyDeviceCost: number | null;
  currency: 'USD';
  reasons: string[];            // stable reason codes, not fabricated marketing copy
  tradeoffs: string[];          // stable tradeoff codes
  assumptions: string[];
  sourceUrls: string[];
  rankScore: number;
};

type RecommendationResponse = {
  recommendations: Recommendation[];
  catalogAsOf: string;
  warnings: string[];
  questions: string[];
};
```

**Note:** `Partial<Preferences>` is shallow. For nested priorities/eligibility, either define a deep patch or replace the whole nested object. Choose and test one convention before integration. Default null/unknown fields must never be interpreted as false.

## API

`POST /api/recommendations`  
Request: `{ "preferences": Preferences }`  
Response: `RecommendationResponse`  
Invalid inputs: HTTP 400 and `{ "error": "..." }`. Return zero recommendations with a helpful warning when no options satisfy verified hard constraints; never silently violate hard budget/eligibility constraints.

`POST /api/agent-action` *(optional if voice tools can securely call local service directly)*  
Request: `{ "action": "get_recommendations" | "update_preferences" | "explain_term" | "explain_recommendation", "payload": object, "sessionId": string }`  
Response: typed event with `preferencesUpdated`, `recommendationsUpdated`, or `assistantText` and a stable `sessionId`. Do **not** expose an unauthenticated endpoint that allows unrestricted model/tool calls or expense generation; use provider-supported secure session mechanisms.

## Client event interface

```ts
type AppEvent =
  | { type: 'transcript'; speaker: 'user' | 'assistant'; text: string; final: boolean }
  | { type: 'listening_state'; state: 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'; message?: string }
  | { type: 'preferences_updated'; preferences: Preferences }
  | { type: 'recommendations_updated'; data: RecommendationResponse }
  | { type: 'language_changed'; language: Language };
```

**Frontend consumes events, not ElevenLabs-specific payloads.** Voice lead normalizes ElevenLabs SDK events to `AppEvent`. Recommendation lead returns `RecommendationResponse`. This is the crucial boundary that allows parallel implementation and a text fallback.

## Scoring/eligibility rules

1. Budget is ambiguous until explicitly established whether it covers device + plan. If missing, ask before claiming a bundle fits.
2. Age-related plans can be displayed only when eligibility is confirmed, otherwise label as conditional or exclude from default eligible results.
3. Compare all prices at the same line count. Never compare a 4-line advertised price to a 1-line budget.
4. Device monthly installment estimate requires stated financing term and an explicit estimate disclaimer.
5. Unknown accessibility compatibility cannot be scored as confirmed compatible.
6. If no verified item meets hard requirements, say so; offer nearest alternatives **clearly labeled as over-budget/conditional**, only after user agrees to see them.

## Required fixtures and integration tests

- `fixtures/en-budget-parent.json`: single line, $60 combined budget, readability priority, moderate streaming.
- `fixtures/es-budget-parent.json`: same structured needs as English fixture, language `es`.
- `fixtures/cheaper-update.json`: lower budget or increase price weight, expect new ranking or explicit no-result message.
- `fixtures/unknown-eligibility.json`: 55+ unknown, ensure conditional plan not silently selected.
- `fixtures/no-match.json`: impossible budget, return no qualifying options and helpful explanation.

**Contract freeze checkpoint:** Agree exact type names, files, API route and language changes by hour 1. Changing a contract after hour 4 requires communicating to all owners and adding an integration test.
