import assert from "node:assert/strict";
import test from "node:test";
import type { AppEvent } from "@/shared/types";
import { createMockVoiceAdapter } from "../mock-adapter";
import { VoiceSessionController } from "../session-controller";

function createController(permission: () => Promise<void> = async () => undefined) {
  const adapter = createMockVoiceAdapter();
  const controller = new VoiceSessionController(adapter, permission);
  const events: AppEvent[] = [];
  const turns: string[] = [];
  controller.subscribe((event) => events.push(event));
  controller.subscribeConfirmedTurns((turn) => turns.push(turn.text));
  return { adapter, controller, events, turns };
}

test("moves idle to connecting to listening and cleans up on stop", async () => {
  const { adapter, controller, events } = createController();
  await controller.start("en");
  await controller.stop();

  assert.deepEqual(adapter.starts, ["en"]);
  assert.equal(adapter.endedSessions, 1);
  assert.deepEqual(
    events.filter((event) => event.type === "listening_state").map((event) => event.state),
    ["connecting", "listening", "idle"],
  );
});

test("normalizes interim/final turns, deduplicates confirmed turns, and supports Spanish", async () => {
  const { adapter, controller, events, turns } = createController();
  await controller.start("es");
  adapter.emitMessage({ source: "user", message: "Necesito un teléfono", isFinal: false });
  adapter.emitMessage({ source: "user", message: "Necesito un teléfono", isFinal: true, messageId: "turn-1" });
  adapter.emitMessage({ source: "user", message: "Necesito un teléfono", isFinal: true, messageId: "turn-1" });
  adapter.emitMessage({ source: "ai", message: "Claro, ¿cuál es su presupuesto?" });
  adapter.emitMode("speaking");
  adapter.emitMode("listening");

  assert.deepEqual(adapter.starts, ["es"]);
  assert.deepEqual(turns, ["Necesito un teléfono"]);
  assert.deepEqual(
    events.filter((event) => event.type === "transcript").map((event) => [event.speaker, event.final]),
    [["user", false], ["user", true], ["user", true], ["assistant", true]],
  );
  assert.deepEqual(
    events.filter((event) => event.type === "listening_state").map((event) => event.state),
    ["connecting", "listening", "speaking", "listening"],
  );
});

test("surfaces microphone denial without creating a provider session", async () => {
  const denied = new DOMException("Denied", "NotAllowedError");
  const { adapter, controller, events } = createController(async () => Promise.reject(denied));
  await controller.start("en");

  assert.deepEqual(adapter.starts, []);
  assert.deepEqual(events.at(-1), {
    type: "listening_state",
    state: "error",
    message: "Microphone permission was denied. You can continue by typing.",
  });
});

test("returns to idle when a live provider session disconnects", async () => {
  const { adapter, controller, events } = createController();
  await controller.start("en");
  adapter.disconnect();

  assert.deepEqual(events.at(-1), { type: "listening_state", state: "idle" });
});
