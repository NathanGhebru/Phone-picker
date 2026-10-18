# VoiceMatch voice demo

The frontend registers `process_voice_turn` with
`controller.start(language, { clientTools })`. Its handler sends the utterance
through the same `processTurn()` pipeline used by typed input, updates the
application from the returned events, and returns the grounded `assistantText`
to ElevenLabs. Transcript subscriptions are observational; they must not run
another application turn.

## Configure both ElevenLabs agents manually

In **Tools → Add Tool**, choose **Client** and use the exact name
`process_voice_turn` on both the English and Spanish agents. Use this parameter
schema; do not add a language, preference, product, or recommendation parameter:

```json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "description": "The user's latest complete utterance in its original language. Preserve preferences, amounts, and corrections. Do not summarize, translate, infer, or add product facts."
    }
  },
  "required": ["text"],
  "additionalProperties": false
}
```

Use these settings for both agents:

- **Wait for response:** enabled (`expects_response: true`).
- **Execution mode:** Immediate (`immediate`).
- **Response timeout:** 30 seconds. This leaves room for the application's
  15-second recommendation-request deadline to return an honest failure reply.
- **Interruptions:** Allow (`allow`), including while the explanation is spoken.
- **Pre-tool speech:** Off, so the first substantive reply uses the tool result.
- **Tool description:** “Process the user's latest phone-shopping turn, update
  their preferences and displayed recommendations, and return the grounded reply
  to speak. Call once per complete user turn and wait for the result.”

The response is a string containing `assistantText`; no second speech API call
or `processTurn()` call is needed. The tool name and parameter identifier must
match the browser registration exactly. See the official
[client-tool guide](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools),
[tool configuration fields](https://elevenlabs.io/docs/eleven-agents/api-reference/tools/create),
and [interruption settings](https://elevenlabs.io/docs/eleven-agents/customization/tools/tool-configuration/tool-interruptions).

Set the English agent's default language to English (`en`) and the Spanish
agent's to Spanish (`es`), with a greeting in the corresponding language. Enable
**Security → Language override** on both: the existing adapter passes
`overrides.agent.language`. Other override permissions are not required by this
integration. See [language overrides](https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides).

Keep the working signed-URL authentication settings. The server selects the
agent using `ELEVENLABS_VOICE_AGENT_ID_EN` or `ELEVENLABS_VOICE_AGENT_ID_ES`; the
private API key stays in server-side configuration. Save/publish the agent
configuration used by those IDs.

Changing the application's language stops an active voice session. Select the
new language, then start the microphone again to connect to that language's
agent. A language change is not an in-place provider-agent switch.

## Prompt to paste into both agents

Use the following as the client-tool behavior instructions, replacing any
conflicting directions to independently collect structured preferences or call
other recommendation tools. Keep an English greeting on the English agent and
a Spanish greeting on the Spanish agent.

```text
You are VoiceMatch, an independent phone-and-plan shopping demo.
Speak in this agent's configured language.

For every complete user turn about phone shopping, including preferences,
budgets, accessibility, corrections, clarification answers, comparisons, and
recommendation questions, call process_voice_turn exactly once. Pass the user's
latest complete utterance in text, in its original language. Do not translate,
summarize, infer preferences, or add product facts to that argument.

Wait for the tool response before giving a substantive answer. The returned
text is the authoritative reply: speak it naturally, preserving its phone and
plan names, costs, caveats, uncertainty, and any follow-up question. Do not add
recommendations, prices, product capabilities, or promotional claims from your
own knowledge. Catalog estimates are not guaranteed live offers.

If the tool says no option matches or a lookup failed, say that honestly. Do not
claim recommendations were updated or invent an alternative. If it asks a
question, ask that question and wait for the user. Do not call the tool again
with its own response. A tool response is not another user utterance.

Allow users to interrupt. Listen to their correction and call the tool once with
the new completed utterance. Treat accessibility needs respectfully and do not
assume age, disability, or eligibility for special pricing.
```

## Manual demo and acceptance checks

These are checks to perform, not a record that a live voice test passed. Use the
actual browser microphone, both configured agents, and audible speaker output.
In browser developer tools, confirm that preference turns reach
`POST /api/recommendations` and that the visible cards use its returned IDs,
ranking, prices, reasons, and tradeoffs. The ElevenLabs conversation history
should show `process_voice_turn` and the returned grounded response.

1. Select English and start voice. Say: “I need one line. My budget is 80 dollars
   a month including the phone and plan. I want large text and an easy-to-use
   phone.” Confirm one line, combined monthly budget of $80, and accessibility
   needs in the UI; inspect the ranked phone-and-plan cards and the spoken reply.
   Accessibility support should only be described as verified when the returned
   catalog data supports that claim.
2. Correct the request: “Actually, my budget is 70 dollars a month, still
   including the phone and plan.” Confirm the new budget replaces $80 while
   line count and accessibility needs remain. Ask “Why this phone?” and “Is
   there a cheaper option?” Confirm explanations reference the returned options
   and do not invent a cheaper device or price.
3. Interrupt an explanation with “Actually, make my budget 60 dollars a month.”
   Confirm audio interruption and processing of the new completed turn. Verify
   that a delayed earlier request cannot overwrite the corrected state. Then
   stop the session during a pending request and restart; stale handlers/results
   must not mutate the new session.
4. Say “My budget is 1 dollar a month including the phone and plan.” Confirm an
   honest no-match result and no stale cards presented as matches for that budget.
5. Switch to Spanish and restart voice. Say: “Necesito una línea. Mi presupuesto
   es de 80 dólares al mes, incluyendo el teléfono y el plan. Quiero letras
   grandes y un teléfono fácil de usar.” Confirm the same preferences, ranked
   cards, and a Spanish spoken reply. Continue with “En realidad, mi presupuesto
   es de 70 dólares al mes, incluyendo el teléfono y el plan”, then “¿Por qué
   este teléfono?” and “¿Hay una opción más barata?”. Repeat the no-match check
   with “Mi presupuesto es de 1 dólar al mes, incluyendo el teléfono y el plan.”
6. Ask for an unsupported product or capability. Confirm the assistant clearly
   states any limitation; it must not claim a product or feature is verified
   unless supported by the returned catalog recommendation data.

For failure checks, use the integration test harness or local request mocking:
send malformed tool arguments such as `{}`, `{ "text": 42 }`, empty text, or
unexpected extra fields. They must not change preferences or request misleading
recommendations. Simulate a failed, malformed, and timed-out recommendation
response; confirm an honest localized error and usable retry/typed input. Do
not break credentials or change shared agent settings to simulate a failure.

Mocked SDK/handler tests can verify registration, state changes, grounded return
values, duplicate prevention, and stale-session guards. They do not establish
that real speech transcription, dashboard tool selection, microphone access,
interruption audio, or audible responses work. Dashboard settings and those live
checks remain unverified until explicitly exercised.

## Verification before handoff

Run the relevant automated suites and record their actual outcomes separately:

```sh
npx --yes tsx --test src/voice/__tests__/*.test.ts
node src/agent/__tests__/runner.mjs
npx tsc --noEmit
npm run lint
npm run build
```

Also run the frontend voice-bridge and recommendation suites present in the
repository. Commit only the reviewed task changes on the current working branch;
do not merge unrelated work, push, or include `.env.local` or credentials.
