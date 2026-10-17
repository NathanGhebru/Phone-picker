# VoiceMatch — 16-Hour Hackathon Build Plan

**Status:** MVP scope frozen for build kickoff  
**Team:** 3 developers, each assisted by multiple AI coding agents  
**Duration:** 16 hours  
**Target:** A polished, working, bilingual (English/Spanish), voice-first T-Mobile phone-and-plan recommendation demo

> **One-line pitch:** Find the right phone by describing your life, not by understanding the specs.

## 1. Problem, solution, and intended audience

Phone shopping often assumes customers can read dense interfaces, understand mobile-network jargon, compare many specifications, and navigate complicated product filters. Those assumptions can exclude people with limited digital literacy, language barriers, and certain accessibility needs.

**VoiceMatch** is an accessibility-first conversational shopping assistant. A user explains their situation in English or Spanish, primarily through voice. The assistant asks only the most useful follow-ups, translates everyday needs into structured requirements, ranks a small curated set of T-Mobile phone-and-plan options, then explains 2–3 recommendations in everyday language. Users can interrupt, ask what technical terms mean, or request changes such as "make it cheaper."

**Primary audiences:** older adults, users uncomfortable with technical interfaces, English/Spanish speakers, and users who benefit from simpler interaction or accessible display and hearing features. Do not assume age alone determines technical ability or accessibility needs.

**Important accessibility qualification:** Voice is the primary interface, **not the only interface**. Always keep transcript, typing, keyboard access, readable cards, and non-audio controls available. Voice-only would exclude deaf/hard-of-hearing users and people unable to speak comfortably.

## 2. Hackathon positioning

| Track | Framing |
|---|---|
| Community Kitchen (main) | Digital-equity and accessibility: easier access to connectivity decisions through voice, plain-language explanations, and Spanish support. |
| Phone Shopping / The Matchmaker | Conversational shopping that matches everyday needs to device + plan bundles. |
| SideShift / Best Startup Idea | Potential conversational commerce/accessibility layer for high-friction purchases. Phones are the initial use case; future distribution could include carrier partnerships, community organizations, and multilingual outreach. |

**Differentiator vs. a generic chatbot:** curated carrier data + extractable requirements + reproducible filtering/ranking + transparent tradeoffs + accessible bilingual voice and visual interface.

## 3. Definition of done — required MVP

1. User opens a responsive single-page site and chooses **English** or **Español**.
2. User begins a voice session through ElevenLabs **if the account has access to the required conversational-agent features**. A text input is always available, including as a fallback.
3. The assistant accepts a natural life story, not a technical questionnaire.
4. The application records structured preferences (budget, usage, lines, device needs, accessibility constraints) and asks only 2–4 targeted follow-up questions when needed.
5. The application ranks **approximately 12 curated phones and 5 curated T-Mobile plans** using code, not arbitrary LLM product selection.
6. The screen displays **top 3 device-and-plan options**, with clear reasons and tradeoffs. The assistant can explain them out loud in the current language.
7. Voice/text requests such as **“Why that one?”**, **“What does hotspot mean?”**, and **“Make it cheaper”** are handled without starting over.
8. A complete core journey works in **both English and Spanish** using the *same product data and recommendation engine*.
9. The UI has large controls, keyboard access, high contrast, visible text/transcript, clearly labeled microphone status, and explicit confirmation of preferences.
10. Prices are presented as **estimates based on a timestamped demo dataset**, not live offers or guarantees.

**Acceptance test:** Start in Spanish, describe a phone for a parent with a tight total monthly budget and a hard-to-read screen; get 3 options; ask for cheaper choices; ask what “datos móviles” means; see cards update and hear/see an understandable Spanish explanation. Repeat core journey in English.

## 4. Core experience (happy path)

1. **Landing:** “Tell us about how you use your phone.” Select English/Español; large Start Talking button; Type instead option.
2. **Needs story:** “My mom mostly calls family, watches YouTube, finds small text hard to read, and we can spend about $60 a month.”
3. **Extraction:** Understand intended user, monthly total budget, light/moderate data, readability/accessibility, and possibly unclear questions (new vs existing line, number of lines, device financing assumptions).
4. **Targeted follow-up:** Ask only about the most consequential missing variable. Example: “Does that $60 include both the phone and the plan?”
5. **Recommendation:** 3 ranked bundles appear: Best Match, Lowest Cost, and Alternative (avoid invented percentages).
6. **Explanation:** “I prioritized larger displays and lower total costs because you mentioned…” Show monthly *estimated plan + device* cost and major assumptions.
7. **Conversational edits:** “Make it cheaper,” “I need a better camera,” “What is hotspot?” → update preference state, rerank when necessary, explain jargon otherwise.
8. **Review:** User can visually confirm or correct recognized needs and inspect the plan/device details; no checkout.

## 5. Features and priority

| Feature | Priority | Notes |
|---|---|---|
| Real-time microphone conversation | P0 | Use ElevenLabs conversational-agent capability if available; validate access immediately. |
| English and Spanish support | P0 | Explicit language toggle; spoken interaction and key UI strings localized. |
| Type-in fallback | P0 | Same application actions/ranking flow as voice. |
| Structured requirement extraction | P0 | A constrained schema; no invented budget or medical/accessibility details. |
| Small curated phones + plans dataset | P0 | 12 phones / ~5 plans; verifiable fields with citations, as-of date. |
| Deterministic scoring and hard filters | P0 | Monthly budget, eligibility, accessibility and known constraints matter. |
| 3 recommendations + rationale + tradeoffs | P0 | Never claim a feature when field unknown. |
| Follow-ups: why, explain term, cheaper | P0 | Demo-critical. |
| UI transcript / large controls / readable cards | P0 | Audio is not sole path. |
| Automatic language detection | P1 | Add only after manual language selection works. |
| Automatic skill-level adjustment | P1 | Can be a prompt rule; avoid stereotyping. |
| Voice interruption / barge-in polish | P1 | Depends on chosen agent SDK and configuration. |
| Shareable results and saved conversations | P2 | No accounts in MVP. |
| Inventory, checkout, trade-ins, promotions, real-time pricing | OUT | Too much complexity and likely requires business access. |
| Existing-customer account integrations | OUT | Not needed. |

## 6. Data design and price honesty

Use local, version-controlled `phones.json` and `plans.json` during the hackathon. Select a representative mix of affordable, mid-range, and premium iOS/Android phones. Include 55+ or other eligibility-based offers only when explicitly marked as conditional; **never infer eligibility from the user mentioning their parent’s age without confirmation**. The catalog is curated and not exhaustive.

Each **phone** record should include: stable ID, name, brand, list price, financing months (if assumed), screen size, storage, battery/spec highlights, camera tier, plain-language strengths/weaknesses, accessibility features backed by source, official product URL, source date, and unknown-field indicators.

Each **plan** record should include: stable ID, plan name, per-line prices keyed by line count where verified, data and hotspot allowances/limitations, eligibility criteria, taxes/fees/autopay assumptions, source URL/date, and caveats. Do **not** invent promotional pricing, eligibility, or precise device monthly payments.

**Price methodology:** `estimated monthly total = verified plan monthly estimate + (device list price / financing term)` if a term is shown and explained. Clearly distinguish plan-only vs combined budget. If fees, taxes, down payment, credits or financing eligibility are unknown, show “before applicable taxes/fees; excludes promotions; financing is illustrative.” If trustworthy price information is unavailable, display “Price unavailable” rather than guessing. Display dataset `asOf` date and linked official sources. Source collection is manual for MVP; do not depend on a presumed public T-Mobile product API.

## 7. Recommendation logic and conversational state

**Single shared state (English-language internal enum values regardless of spoken language):**

```json
{
  "language": "es",
  "budgetMonthlyTotal": 60,
  "budgetIncludesDevice": true,
  "lines": 1,
  "newOrExistingCustomer": "unknown",
  "devicePurchaseMode": "monthly",
  "priorities": { "camera": 1, "battery": 3, "displayReadability": 5, "simplicity": 5, "hotspot": 1 },
  "usage": ["calls", "video"],
  "accessibilityNeeds": ["readable_text"],
  "eligibility": { "age55Plus": "unknown" },
  "unansweredQuestions": ["new_or_existing_customer"],
  "lastRecommendationIds": []
}
```

Numbers in the example are illustrative. The extractor must respect an explicit distinction between **unknown**, **not applicable**, and **no**. Do not assume use of hearing aids from a user saying calls are hard to hear. Ask for clarification only when necessary.

**Ranking:** Apply hard constraints first (verified budget/eligibility, device purchase mode, explicit must-haves), then use a weighted rubric on price fit, accessibility fit, battery, readability, camera, data/hotspot fit, and simplicity. Use simple 0–5 feature ratings only when the team's rubric documents their meaning. Return scored options and machine-readable reasons; LLM produces a concise human explanation **from these results only**. Show limitations and tradeoffs and distinguish missing evidence from a negative feature.

**Actions to support:** `update_preferences`, `get_recommendations`, `explain_recommendation`, `explain_term`. Keep agent tool contracts explicit; never let free-form voice responses be the sole source of truth for recommendation IDs/prices.

## 8. Technical architecture

```text
Web app (React / Next.js or Vite; choose one at kickoff)
  ├─ Large mic button, language toggle, chat/transcript, recommendation cards
  ├─ Text input fallback
  ├─ ElevenLabs browser conversational-agent SDK (if entitled)
  └─ App controller (typed state + tool/action bridge)
             │
             ▼
Backend API (light Node/TypeScript service or Next.js API routes)
  ├─ Session / preferences state
  ├─ LLM extraction + conversation tool handlers
  ├─ Pure deterministic recommendation engine
  └─ Static JSON catalog (phone/plan records + source metadata)
```

**Design choice at kickoff:** One repo, TypeScript throughout, one package manager. Avoid splitting into microservices. Credentials stay server-side. Browser may use only provider-supported public tokens or server-issued signed URLs; never publish private ElevenLabs/API secrets. Confirm the actual ElevenLabs plan includes conversational agents and the required minutes; “Creator API”/TTS access does **not** automatically prove agent entitlement. Have a text-first backup ready.

**Language behavior:** The chosen language controls the spoken agent and localized UI. Catalog keys and recommendation result IDs stay language-neutral. Start with explicit language selection; automatic spoken-language detection is optional. Confirm ElevenLabs’ agent multilingual/voice capabilities and usage limits in the team account at the beginning.

## 9. Team split — where the detailed plans live

**Do not put three separate gigantic agent task prompts in this README.** This file is the product source of truth; shared schemas go in [`CONTRACTS.md`](CONTRACTS.md), and each person owns one handoff file. This avoids conflicting requirements and allows multiple AI agents to work in parallel.

| Human owner | Primary responsibility | Workstream file | Owned code areas |
|---|---|---|---|
| Person 1 — UI / UX lead | Responsive accessible interface, localization, transcript, recommendation cards, integration shell | [`WORKSTREAM-1-FRONTEND.md`](WORKSTREAM-1-FRONTEND.md) | `src/components/**`, `src/pages/**` or `src/app/**`, `src/i18n/**`, styles |
| Person 2 — Conversation / voice lead | ElevenLabs integration, bilingual conversation, extraction and voice-to-app action bridge | [`WORKSTREAM-2-VOICE.md`](WORKSTREAM-2-VOICE.md) | `src/voice/**`, `src/agent/**`, server voice/session endpoints |
| Person 3 — Catalog / recommendations lead | Curated T-Mobile data, validation, ranking and recommendation endpoint | [`WORKSTREAM-3-RECOMMENDATIONS.md`](WORKSTREAM-3-RECOMMENDATIONS.md) | `src/data/**`, `src/recommendations/**`, backend recommendation endpoints |

Ownership is **per file/directory**, not just per feature. Do not let multiple agents rewrite the same component/config. Each human coordinates their own AI agents, reviews AI diffs, runs tests, and merges one coherent vertical slice. Cross-team interface changes require agreement and an update to `CONTRACTS.md` before code modifications.

**Repository pattern:** One shared GitHub repo, `main` protected as the demo branch; each owner uses `feature/frontend`, `feature/voice`, or `feature/recommendations` and small PRs. Recommended subtask agents: one implementing and one testing/reviewing in each owner's worktree, **never two simultaneous writers on the same files**. A single human serves as integration lead (suggest Person 1), but each owner must handle integration bugs in their area.

## 10. Timeline (wall-clock hours; owners work concurrently)

| Hour | Shared checkpoint | Frontend | Voice | Recommendations |
|---|---|---|---|---|
| 0–1 | Freeze framework, API contracts, sample scenario; test API keys/access | Scaffold UI and i18n | Test ElevenLabs agent from browser; fallback decision | Define catalog/ranking schema |
| 1–4 | Parallel build | Mic/transcript shell, cards, toggle | Voice session + transcript + bilingual prompts | Curate records + deterministic ranking |
| 4–6 | First integration | Connect mock action payloads to UI | Hook conversation to typed action bridge | Expose `getRecommendations` and fixtures |
| 6–8 | **End-to-end demo must work, even if ugly** | Render real recommendations | Pass confirmed preferences to engine | Fix data/pricing/filters |
| 8–11 | Handle follow-ups and Spanish | Polish Spanish UI and action states | Explain/cheaper/why workflows, English/Spanish tests | Alternative reranking, rationale and tests |
| 11–13 | Accessibility and robustness | Keyboard, readable layouts, errors | Retry/mic permissions/agent failure fallback | Missing info, eligible plans, no-results handling |
| 13–15 | Demo freeze: test on actual target laptop/browser | UI fixes only | Latency and bilingual rehearsal | Price/source audit; fixture checks |
| 15–16 | **No new features: pitch + rehearsal** | Present interface | Present voice demo | Explain recommendation reliability |

**Stop rule:** At hour 6, if conversational API integration is still unreliable, deliver a working text-first recommendation journey and add recorded/limited live speech only if it is dependable. At hour 8, stop adding features until one English and one Spanish journey work end-to-end.

## 11. Demo script and judge narrative

**~90-second core demo:** Spanish user: “Necesito un teléfono para mi mamá. Le cuesta leer letras pequeñas. Habla con la familia, ve YouTube y quiero gastar unos sesenta dólares al mes, incluyendo el teléfono.” Agent confirms budget and follows up only if a critical detail is missing. The app displays 3 ranked options. User asks: “¿Por qué recomiendas ese?” then “¿Hay algo más barato?” and “¿Qué significa hotspot?” The assistant explains and reranks. Point to a visible source date and plain-language budget assumption. If possible, repeat one short exchange in English.

**Pitch structure:** (1) Shopping accessibility barrier, (2) user story, (3) live bilingual flow, (4) transparent scoring and price sources, (5) next steps and possible channel to reach users (libraries, community centers, carrier accessibility teams). Avoid portraying the product as medically certified, officially endorsed by T-Mobile, or fully live-priced.

## 12. Risks, mitigations, and release checklist

| Risk | Mitigation |
|---|---|
| ElevenLabs Creator access does not include required agent feature | Verify first hour; maintain text input as full functional fallback; don't promise unsupported real-time voice. |
| Bilingual session/cross-language audio errors | Explicit language toggle first; two stable language configurations if needed. |
| Agent hallucinates pricing/features | Structured tool results only; no invented price claims; link data source and as-of date. |
| Voice transcript extracts a wrong budget | Show a visible preference summary; ask to confirm/allow correction. |
| API cost/latency/network outage | Timebox calls, error states, optional fixed demo fallback, token/minute limits. |
| Parallel AI agents overwrite files | Directory owners; schemas fixed; review PRs; no agent pushes to `main`. |
| Ranking feels arbitrary | Deterministic rules, reason codes and unit tests; explain tradeoffs. |
| Accessibility claims are oversold | Test keyboard and screen-reader basics; document limitations; do not claim WCAG certification without audit. |

**Before presenting:** [ ] English end-to-end  [ ] Spanish end-to-end  [ ] Text fallback  [ ] Mic denied/error state  [ ] 3 valid recommendations  [ ] Price assumptions shown  [ ] Source links verified  [ ] “Why?” works  [ ] “Cheaper” reranks  [ ] Jargon explanation works  [ ] Keyboard controls  [ ] No private secrets in browser/repo  [ ] Demo branch deployed/accessible  [ ] Pitch rehearsed.

## 13. Explicitly out of scope

No e-commerce transaction, purchase checkout, carrier login, billing-account access, persistent user accounts, real-time store inventory, scraped complete carrier catalog, live promo/pricing promises, complex eligibility underwriting, training custom speech models, or fine-tuning an LLM. These are future-product possibilities, not hackathon deliverables.

## 14. Future roadmap (not MVP promises)

Automatic language detection, broader multilingual support, verified up-to-date carrier integrations, more device models, explainable voice-first comparisons, shared recommendation summary, store handoff, access to benefits/affordability programs, user-tested accessibility improvements, and optional community-organization distribution.
