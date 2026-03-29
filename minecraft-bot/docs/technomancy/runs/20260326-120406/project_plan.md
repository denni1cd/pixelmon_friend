# Project Plan

## Milestones
1. `milestone_1`
   Scope: allowlisted intent schema, LM Studio prompt/parse support, validation helpers, chat-router integration, automated tests, and run verification artifacts.

## Sequencing
- Single milestone only. The schema, prompt contract, validation helpers, and chat-routing logic all touch the same small set of files and should be integrated sequentially in one same-tree milestone.

## Allowed Touchpoints
- `src/bot/app.js`
- `src/bot/lm-studio.js`
- new intent-router / validation / prompt modules under `src/bot/**`
- `src/bot/command-parser.js` only if routing integration requires targeted updates
- `test/**`
- `docs/technomancy/runs/20260326-120406/**`

## Sensitive Touchpoints
- Exact-command precedence in the chat loop
- Existing LM Studio ordinary-conversation path
- Task-manager busy and failure behavior
- Existing workflow capability boundaries and registry resolution

## Acceptance Strategy
- Preserve exact commands first.
- Add an explicit allowlisted action catalog and intent schema before any router integration.
- Route only validated intents into existing capability/workflow calls.
- Reject unsupported and invalid intents clearly instead of improvising behavior.

## Verification Strategy
- Add unit coverage for intent-schema validation and allowlist enforcement.
- Add tests for argument normalization and deterministic defaults.
- Add integration tests for chat-router handoff from natural-language messages into capability execution.
- Add fallback tests for LM Studio unavailable / invalid payload paths.
- Record manual LM Studio success-path and refusal-path checks honestly if they cannot be run here.

## Integration Strategy
- Freeze the intent schema and allowlist first.
- Extend the LM Studio client with a structured intent path separate from ordinary conversation replies.
- Add router classification with exact-command bypass before the LLM path.
- Validate parsed intents before capability lookup and execution.
- Keep ordinary conversation on the existing non-task reply path.
