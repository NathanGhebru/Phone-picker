import assert from "node:assert";
import { describe, it } from "node:test";
import {
  decideNextAction,
  resolvePendingFollowUpAnswer,
} from "../conversation-policy";
import { createInitialConversationState } from "../conversation-engine";
import { createInitialPreferences } from "../preference-state";

describe("Conversation Policy", () => {
  it("prioritizes asking line count when lines is null", () => {
    const prefs = createInitialPreferences("en");
    prefs.budgetMonthlyTotal = 60;
    prefs.budgetIncludesDevice = true;
    const state = createInitialConversationState();

    const action = decideNextAction({
      preferences: prefs,
      conversationState: state,
      intent: "preference_statement",
      language: "en",
    });

    assert.strictEqual(action.type, "ask_followup");
    if (action.type === "ask_followup") {
      assert.strictEqual(action.questionKey, "lines");
      assert.ok(action.question.includes("How many phone lines"));
    }
  });

  it("prioritizes clarifying budget scope when budget is provided without device scope", () => {
    const prefs = createInitialPreferences("en");
    prefs.lines = 1;
    prefs.budgetMonthlyTotal = 60;
    prefs.budgetIncludesDevice = null;
    const state = createInitialConversationState();

    const action = decideNextAction({
      preferences: prefs,
      conversationState: state,
      intent: "preference_statement",
      language: "en",
    });

    assert.strictEqual(action.type, "ask_followup");
    if (action.type === "ask_followup") {
      assert.strictEqual(action.questionKey, "budget_scope");
      assert.ok(action.question.includes("include both the phone and the plan"));
    }
  });

  it("proceeds to recommendation fetch once lines and budget scope are known", () => {
    const prefs = createInitialPreferences("en");
    prefs.lines = 1;
    prefs.budgetMonthlyTotal = 60;
    prefs.budgetIncludesDevice = true;
    const state = createInitialConversationState();

    const action = decideNextAction({
      preferences: prefs,
      conversationState: state,
      intent: "preference_statement",
      language: "en",
    });

    assert.strictEqual(action.type, "fetch_recommendations");
  });

  it("stops asking follow-ups once limit is reached", () => {
    const prefs = createInitialPreferences("en");
    // Lines still null, but follow up limit is reached!
    const state = createInitialConversationState();
    state.followUpQuestionsAsked = 3;

    const action = decideNextAction({
      preferences: prefs,
      conversationState: state,
      intent: "preference_statement",
      language: "en",
    });

    assert.strictEqual(action.type, "fetch_recommendations");
  });

  it("resolves direct answers to pending questions", () => {
    const answerBudgetBoth = resolvePendingFollowUpAnswer("Both", "budget_scope");
    assert.deepStrictEqual(answerBudgetBoth, { budgetIncludesDevice: true });

    const answerBudgetPlan = resolvePendingFollowUpAnswer(
      "Just the plan",
      "budget_scope"
    );
    assert.deepStrictEqual(answerBudgetPlan, { budgetIncludesDevice: false });

    const answerLines = resolvePendingFollowUpAnswer("just one line", "lines");
    assert.deepStrictEqual(answerLines, { lines: 1 });
  });
});

