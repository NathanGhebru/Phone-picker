# Voice transport setup

This directory emits only normalized `AppEvent` values. It does not extract preferences or choose recommendations; confirmed user turns are exposed separately through `subscribeConfirmedTurns` for the agent/orchestration workstream.

## One required dependency

The repository currently has no ElevenLabs browser client. The voice owner should run this shared-dependency change before wiring the real adapter:

```powershell
npm install @elevenlabs/client@1.27.0
```

The real bootstrap imports `Conversation` from that package and injects it once; React components subscribe only to `VoiceSessionController`:

```ts
import { Conversation } from "@elevenlabs/client";
import { createElevenLabsVoiceAdapter } from "@/voice/elevenlabs-adapter";
import { VoiceSessionController } from "@/voice/session-controller";

export const voiceController = new VoiceSessionController(
  createElevenLabsVoiceAdapter(Conversation),
);
```

## Server environment

Set these only in `.env.local`/deployment secrets; never prefix them with `NEXT_PUBLIC_`.

```dotenv
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_AGENT_ID_EN=agent_...
ELEVENLABS_VOICE_AGENT_ID_ES=agent_...
# Optional: exact deployed browser origin, e.g. https://voicematch.example
VOICEMATCH_APP_ORIGIN=
```

In the ElevenLabs dashboard, configure two private agents (or two supported language configurations), enable signed-URL authentication, and enable the client transcript events used by `onMessage`. Do not combine signed-URL authentication with an allowlist on the same agent. The server chooses the agent from the validated `en`/`es` language request, so the client cannot choose an arbitrary agent ID.

Signed URLs are deliberately returned with `Cache-Control: no-store`, not logged, and should be used immediately. ElevenLabs documents a 15-minute initiation lifetime for signed URLs.

## Testing

`createMockVoiceAdapter()` needs no credentials and simulates modes, messages, errors, disconnects, and cleanup. The repository has no test runner yet. Minimum shared setup recommendation:

```powershell
npm install -D vitest
```

Then add `"test": "vitest run"` to `package.json` by agreement with the other workstreams. Live microphone tests still require the team account and browser permission; they have not been run from this worktree.

## Provider finality limitation

The public SDK docs describe tentative and final user transcriptions but do not document a stable turn ID in its callback example. User messages without `isFinal`/`is_final`/`final` are kept interim. Confirmed turns are deduplicated by provider ID when present, otherwise by identical text only in a two-second window. This prevents repeated callback processing without permanently suppressing a user who intentionally repeats a phrase later.
