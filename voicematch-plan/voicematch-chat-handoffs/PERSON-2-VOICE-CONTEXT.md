# VoiceMatch — Context Handoff for a New ChatGPT Chat

> **Read this entire document before suggesting implementation.** This is a self-contained project briefing for a 16-hour hackathon. The final section assigns your specific workstream; do not take ownership of another person's work. When repo files are accessible, use `README.md`, `CONTRACTS.md`, and your `WORKSTREAM-*.md` as the authoritative details. This handoff summarizes them, not replaces them.

## 1. Project and motivation

**VoiceMatch** is an accessibility-first, English/Spanish, **voice-first phone and phone-plan shopping advisor**, using a small curated T-Mobile catalog. The user explains everyday life instead of knowing specifications: e.g., “My mom mainly calls family, watches YouTube, struggles with small text, and needs to spend around $60/month.” The assistant asks a few relevant follow-ups, extracts structured constraints, recommends 2–3 phone+plan bundles, explains tradeoffs and jargon, and can rerank when the user says “make it cheaper.”

**Pitch:** *Find the right phone by describing your life, not by understanding the specs.*

**Why it matters:** conventional telecom storefronts demand familiarity with technical terms and complicated interfaces. Intended audiences include older adults, users with limited digital literacy, Spanish-speaking users, and people who need accessible controls. Never assume someone lacks technical skill based on age or language. **Voice-first is not voice-only**: typed input, transcript, keyboard navigation, readable cards and clear mic controls are mandatory.

**Hackathon tracks:** Community Kitchen (accessibility/equity), phone-shopping Matchmaker, and SideShift Best Startup Idea. Startup framing: accessible conversational commerce for difficult purchasing decisions; phone shopping is the wedge.

## 2. Team, resources, and constraints

- **3 developers, 16 hours total**, each potentially using **multiple AI coding agents** concurrently.
- **Person 1:** frontend, accessibility, bilingual UI and application integration lead.
- **Person 2:** ElevenLabs voice integration, conversational AI, English/Spanish speech and extraction.
- **Person 3:** T-Mobile product/plan data, deterministic recommendation engine, prices, tests and recommendations API.
- They have stated access to an **ElevenLabs Creator API/account**. **Do not assume this grants ElevenLabs Agents/conversational access**. Verify entitlement, API quota and live browser English/Spanish speech in the first hour. If unavailable, preserve a complete typed-chat fallback and only layer on working speech capabilities.
- Prefer **Next.js + TypeScript + API routes** in one deployable repo; the team must agree at kickoff. Don't unilaterally switch frameworks or add a database.
- All outputs are a **demo prototype**, not a live carrier storefront or T-Mobile-affiliated offering. Use timestamped, verifiable facts, not invented offers, stock, discounts or contract terms.

## 3. Required MVP (priority P0)

1. One responsive website with clear **English / Español** toggle, large “start talking” affordance and **type instead** path.
2. Voice conversation with transcription and spoken agent responses if ElevenLabs setup supports it; status and permission/error handling.
3. Users tell their story naturally; AI extracts preferences rather than reading a fixed questionnaire.
4. Ask **2–4 targeted follow-ups at most where necessary**, one at a time. Prioritize whether monthly budget includes device+plan, number of lines and meaningful accessibility needs.
5. Curated local **~12 phones and ~5 T-Mobile plans**, balanced across price and needs; source URLs and catalog-as-of date.
6. **Deterministic, explainable ranking** of eligible phone/plan combinations. Return up to 3 different choices: best match, lowest cost and alternative. Include costs, assumptions, reasons and tradeoffs.
7. Questions/actions: “Why this one?”, “What does hotspot mean?”, “Make it cheaper,” and user corrections (e.g., “I meant $40”). These should refer to real recommendation data and rerank when appropriate.
8. The **same ranking system** works in English and Spanish. Localize UI and conversational explanations, not canonical product IDs or scores.
9. Accessible UI: visible transcript, keyboard support, high contrast, large tap targets, meaningful focus states and non-audio alternatives.
10. Prices are **illustrative estimates**, with plan + device components, financing/eligibility/tax assumptions and date. Never claim guaranteed live pricing.

**Stretch only after full flow:** auto-detect language, language switching mid-call, advanced interruptions, adaptive depth of explanations, saved/shareable results. **Cut:** checkout, payment, inventory, accounts, trade-ins, real-time promotions, full catalog, complicated database.

## 4. Key technical architecture

```text
Browser UI (Person 1)
  ↔ shared AppEvent + Preferences contract
Voice / LLM adapter (Person 2)  → updates validated preferences
  → POST /api/recommendations (Person 3)
  → curated phones.json and plans.json, price/eligibility/score logic
  → RecommendationResponse
  → visible cards (Person 1) + spoken explanation (Person 2)
```

**Shared contract (see `CONTRACTS.md` for authoritative definitions):**

- `Language = 'en' | 'es'`.
- `Preferences` includes `language`, `budgetMonthlyTotal`, `budgetIncludesDevice`, `maxDeviceUpfront`, `lines`, `devicePurchaseMode`, `newOrExistingCustomer`, priorities for camera/battery/displayReadability/simplicity/hotspot, `usage[]`, `accessibilityNeeds[]`, and `eligibility.age55Plus` (`yes`/`no`/`unknown`). Null and unknown are **not false**.
- `PreferenceUpdate` conveys a patch, evidence and its voice/text/UI origin; watch out for shallow nested patches.
- `POST /api/recommendations` accepts `{ preferences: Preferences }`, returns `{ recommendations, catalogAsOf, warnings, questions }`; return 400 for invalid input and explain no-match scenarios without quietly violating budget.
- Each `Recommendation` has `phoneId`, `planId`, `label`, `estimatedMonthlyTotal`, `monthlyPlanPrice`, `estimatedMonthlyDeviceCost`, `reasons[]`, `tradeoffs[]`, `assumptions[]`, `sourceUrls[]`, `rankScore`, etc.
- Client `AppEvent` variants: `transcript`, `listening_state`, `preferences_updated`, `recommendations_updated`, `language_changed`.
- **Crucial integration boundary:** Person 1 consumes normalized `AppEvent` and `RecommendationResponse`, not direct ElevenLabs SDK objects. Person 2 normalizes voice SDK output. Person 3 owns scoring and API response.

**Reliability constraints:** confirm line count, whether budget includes device, eligibility for special plans (e.g., 55+) and calculation assumptions. Unknown hearing-aid support is **not** proof of compatibility. Don't rank arbitrary LLM hallucinated products. Do not send ElevenLabs secret keys to browser or commit `.env` credentials. Store no sensitive conversation history unless required for current session.

## 5. End-to-end demonstration to build toward

A user selects **Español**, says they need an affordable phone for their mother who struggles to read small text and uses YouTube. The agent asks whether the monthly budget includes the phone and service; the user clarifies. Three sourced, realistically priced bundles appear. The user asks in Spanish what mobile data means, hears an accessible explanation, then asks for a cheaper option. Cards rerank or honestly report no matching option. Repeat essential flow in English. With microphone denied, type input must complete the same journey.

## 6. Sixteen-hour execution and integration cadence

| Window | Whole-team milestone |
|---|---|
| Hour 0–1 | Confirm stack, ownership and shared contracts. Verify ElevenLabs voice entitlement and Spanish smoke test. |
| Hour 1–4 | Build UI mock flow, voice adapter/orchestration, and source-backed catalog/ranker independently. |
| Hour 4–6 | Wire normalized app events, preference updates and recommendations API. |
| **Hour 6–8** | **End-to-end integration deadline:** typed/voice → preferences → recommendations → cards, however unpolished. |
| Hour 8–11 | Add robust why/cheaper/jargon interactions in English and Spanish. |
| Hour 11–13 | Accessibility, failure states, bilingual regression tests, and voice polish. |
| Hour 13–15 | Fix critical demo issues, deploy, freeze scope. |
| Hour 15–16 | Rehearse and present; avoid introducing new risky features. |

**Parallel AI rules:** one human owner per workstream; each agent edits non-overlapping file sets or its own branch. One reviewer may inspect without writing. Freeze `CONTRACTS.md` and `src/shared/types.ts` in first hour; all changes require three-person agreement. Use short, testable commits, communicate API changes immediately and merge/integrate early. Report what changed, how tested, blockers and dependency requests when handing off AI output.

## 7. Primary planning documents and ownership

- `README.md` — project definition, MVP, timeline, architecture and demo.
- `CONTRACTS.md` — shared schemas, events, interfaces and rules; read before coding.
- `WORKSTREAM-1-FRONTEND.md` — Person 1's detailed instructions.
- `WORKSTREAM-2-VOICE.md` — Person 2's detailed instructions.
- `WORKSTREAM-3-RECOMMENDATIONS.md` — Person 3's detailed instructions.

If these files are not attached to this new chat, this handoff is still sufficient to start planning or writing isolated code. Request the repository/contracts only when their exact contents are needed for a safe integration change. Do not pretend to have inspected a repo or tested a live API if you have not.

## 8. YOUR UNIQUE ASSIGNMENT — PERSON 2: VOICE + CONVERSATIONAL AI

You are assisting **Person 2**. **Own** ElevenLabs browser voice integration, bilingual agent configuration, conversation policy, extraction of validated `Preferences`, tool/action handlers and conversion of provider output to shared `AppEvent`. **Do not own React interface design or phone/plan ranking/data.** Read `WORKSTREAM-2-VOICE.md` first when available.

**File ownership:** `src/voice/**`, `src/agent/**`, `src/app/api/voice/**` and agent-action routes as agreed; voice-related tests. Do not edit general UI, source catalog, scoring engine or shared types without consent.

**Critical hour-0 gate:** verify that the team's **ElevenLabs Creator API access really includes conversational ElevenAgents functionality** (not merely TTS), browser integration, available voice minutes, suitable Spanish output and mic→reply path. Explicit `en`/`es` selection is P0; auto-detection is stretch. Protect credentials with server-issued secure session mechanisms; never embed secret API keys in client code.

**Expected deliverables:** start/stop/reconnect voice session, listening/speaking/errors, transcript normalization, English/Spanish turn handling, natural life-story prompts, constrained extraction + validation, relevant follow-up selection, “why this one” explanation tied to returned reasons, “what does hotspot mean” clarification, “make it cheaper” preference update and rerank request, robust text-input handler using same preference/action path. Only final/confirmed intent should commit preferences; guard against partial transcript revisions.

**Split your AI agents:** (A) SDK/transport writer for session and speech events; (B) agent/orchestration writer for prompts, actions, validation and typed fallback in separate files; (C) reviewer for Spanish flows, provider settings, keys and interruption handling. No overlapping edits.

**First tasks:** validate access and a working bilingual mic conversation in browser immediately; establish clear fallback if entitlement fails; prototype the `AppEvent` adapter against fixtures; then implement structured preference extraction and a mock call to `POST /api/recommendations`. Tell teammates by hour 1 what voice capabilities are proven, not assumed.

**Acceptance:** conversation works in English and Spanish when account supports it; a typed fallback also reaches the same engine; events align with contracts; prices/specifications are never invented; agent correctly preserves conversational state for jargon and reranking requests.

**Your response in this new chat:** Start by distinguishing **verified** ElevenLabs capabilities from assumptions. Then show your **first 2-hour technical checklist**, proposed adapter/orchestration file layout and concrete integration needs from Persons 1 and 3. Don't claim the SDK has been tested without an actual test.
