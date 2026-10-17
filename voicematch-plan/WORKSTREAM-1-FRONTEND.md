# Workstream 1 — Accessible Frontend and Integration Shell

**Owner:** Person 1. **Primary mission:** A visually compelling, responsive, keyboard-accessible, bilingual interface that can function with either voice events or typed input. **Integration lead** unless team chooses otherwise.

## Scope

Own landing/active-session/recommendation states; English/Spanish localization; microphone permission/error UI; transcript; typed input; preference confirmation/correction UI; recommendations with cost breakdown and source/assumption disclosures; integration of `AppEvent` and recommendation response defined in [`CONTRACTS.md`](CONTRACTS.md).

## Deliverables

- Responsive landing view with language toggle, clear CTA, sample prompt, and always-visible type fallback.
- Conversation view with listening/speaking/connection states, live transcript, and simple retry.
- Preference summary chips/cards that a user can correct (budget, number of lines, priorities).
- Three result cards (“Best Match,” “Lowest Cost,” “Alternative”), ranking reason chips, tradeoffs, estimated monthly plan/device/total, and linked source metadata.
- Central event adapter/listener to update transcript, preferences, recommendations, and language.
- Keyboard test of all controls; labeled mic button; focus states and readable contrast.
- Localized interface text (do not mechanically translate IDs or catalog keys).

## Parallel AI agent split (within this owner's control)

1. **UI agent (writer):** owns visual components, CSS, responsive layout and static mocked screens.
2. **Accessibility/localization agent (writer):** owns `src/i18n/**` and accessibility tests/docs. May propose fixes to UI but sends them to UI agent rather than editing its files simultaneously.
3. **Review agent (read-only or separate review branch):** screenshots, keyboard navigation, lint/build verification, bug list; no concurrent writes to UI files.

Only the human owner merges these changes into `feature/frontend`.

## Time plan

- **0–1h:** Confirm component stack & schema, scaffold and stub `AppEvent` sample data.
- **1–4h:** Build landing, conversation, recommendations, Spanish UI translations, mock flows.
- **4–6h:** Wire recommendation endpoint and voice event bridge; ensure type fallback functions.
- **6–8h:** Integrate full journey; handle pending/loading/error states.
- **8–11h:** Polish results rationale, language toggles, cheaper reranking behavior.
- **11–13h:** Test keyboard/touch/mobile/contrast and preference corrections.
- **13–16h:** Demo regression, deployment, pitch rehearsal; no new major components.

## Acceptance tests

- Start as English and Spanish; labels and text change clearly.
- With mic denied or ElevenLabs unavailable, typing can complete the full flow.
- Clicking a recommended option reveals transparent reason, tradeoff, price components, source links and assumptions.
- All main actions work without mouse; focus never disappears behind overlays.
- Updating a preference rerenders recommendations without refreshing page.
- Frontend does not refer to provider-specific voice SDK objects outside `src/voice/` adapter.

## Prompt to give your AI coding agent

> Implement Workstream 1 as specified in `README.md` and `CONTRACTS.md`. Only edit frontend-owned directories. Start with typed mock `AppEvent` and `RecommendationResponse` fixtures. Provide a bilingual, accessible, responsive happy path and working text fallback. Do not change shared types/API contracts without approval, do not hardcode fake prices in the UI, and do not add checkout/accounts. Run build/lint/tests and report changed files and integration needs.
