# Workstream 2 — ElevenLabs Voice, Bilingual Conversation, and Agent Actions

**Owner:** Person 2. **Primary mission:** Make the voice conversation useful, bilingual and robust, while producing the same typed events/actions as text input.

## First-hour gate (must run before relying on voice)

1. Check whether hackathon credits/Creator account have **ElevenLabs Agents / conversational-agent access**, browser SDK access, permitted concurrent sessions and remaining usage minutes. TTS API access alone is not sufficient evidence.
2. Test a live browser mic → agent response exchange in **English and Spanish** using an actual team API credential with safe handling.
3. Confirm appropriate multilingual voice/configuration and whether automatic language detection is available on the team's selected account/settings. Don't make automatic detection a dependency.
4. If blocked: mark it immediately in team chat; deliver the same agent/action logic via typed chat and support only reliable speech capabilities as secondary enhancement.

## Deliverables

- Voice session connector that handles start/stop, permission denial, connecting, listening, speaking and error.
- Explicit session language setting `en` or `es`, controlled by UI toggle; Spanish and English spoken prompt behavior.
- Turn transcript normalized into shared `AppEvent` types.
- LLM/system prompt asking for life-story-first conversation, non-technical questions, concise explanations, conditional follow-ups and respectful, non-stereotyped accessibility discussions.
- Extract `Preferences` via structured tool/function calls where supported (or validated JSON through backend). Never trust unvalidated arbitrary LLM output.
- Agent actions that update confirmed preferences, call recommendation endpoint, verbally explain **returned** reasons and tradeoffs, and handle “cheaper,” “why?” and terminology questions.
- One stable adapter for typed messages so text and voice share the same state/action path.

## Conversation guardrails

- Speak in selected language; if user asks for a change, update language state before next response where supported.
- Ask at most one relevant clarifying question at a time; avoid excessive questionnaires.
- Confirm combined vs plan-only budget, line count and important eligibility assumptions before making exact cost claims.
- Explain jargon plainly with simple everyday examples, then resume rather than restarting.
- Respect explicit corrections (“not $60, $40”) by updating structured state and reranking.
- Never invent prices, live availability, offers, device hearing compatibility or official T-Mobile partnership. Use results and source caveats from engine.
- Treat partial transcripts cautiously; commit only final transcription/confirmed intent before reranking.
- Keep personal story data in ephemeral session where feasible; don't log user audio/sensitive content to analytics by default.

## Parallel AI agent split

1. **SDK agent (writer):** owns provider connector, session management, transcript adapter, local browser testing.
2. **Orchestration agent (writer):** owns agent prompt, preference extraction, tool/action handlers and type-in fallback path, in separate files.
3. **Review/test agent:** validates prompt behavior, English/Spanish samples, interruption if available, secrets exposure and failure conditions; no concurrent edits in owners’ files.

## Time plan

- **0–1h:** Verify entitlement; prove browser audio/Spanish; choose fallback.
- **1–4h:** Implement SDK adapter and agent prompt/actions in parallel.
- **4–6h:** Emit `AppEvent`; connect to shared preferences/action interface; Spanish smoke test.
- **6–8h:** End-to-end integration with recommendations.
- **8–11h:** Why/cheaper/jargon and conversational corrections in both languages.
- **11–13h:** Errors, mic permissions, reconnect, optional language-detection polish.
- **13–16h:** Rehearse stable demos and lock agent settings.

## Acceptance tests

- Browser can record/speak in English and Spanish with session language determined by explicit user choice (subject to entitlement).
- Final transcript appears in UI and updates structured state.
- Saying “make it cheaper” lowers budget priority/target or requests lower-priced options rather than hallucinating a new product.
- Saying “what is hotspot?” explains concept; recommendations don't unnecessarily reset.
- Saying “why this one?” cites actual returned reasons and tradeoffs.
- Stopping microphone and mic permission denial display understandable status and leave text path usable.
- No private API key in client bundle, screenshots, committed code or console logs.

## Prompt to give your AI coding agent

> Implement Workstream 2 per `README.md` and `CONTRACTS.md`, within voice/agent-owned files only. First verify ElevenLabs Agents entitlement rather than assuming Creator TTS API works for real-time conversation. Build a multilingual English/Spanish voice adapter normalized to shared `AppEvent`, validated preference/action bridge, concise inclusive prompt and typed-input equivalent. Never invent product prices or select products without invoking recommendation engine. Test both languages and the text fallback. Document credential setup privately via `.env.example` placeholders, and report integration dependencies.
