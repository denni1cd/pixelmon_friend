# Task 2 Handoff

## Task
Integrate exact-command-first natural-language routing into the chat loop and add regression and fallback verification.

## Files Changed
- `src/bot/app.js`
- `src/bot/chat-runtime.js`
- `test/chat-runtime.test.js`
- `test/intent-routing.test.js`

## Summary
- Added a pure chat runtime layer that preserves exact-command precedence.
- Routed validated natural-language intents into the existing registry/task-manager path.
- Preserved ordinary conversation on the LM Studio chat reply path.
- Added safe refusal and LM Studio failure fallback behavior.
- Added integration-style tests for exact command handling, validated intent routing, conversation replies, and refusal cases.

## Commands Run
- `npm test`

## Results
- Full suite passed locally: `51/51`

## Known Limitations
- Live LM Studio success/refusal demonstrations remain manual follow-up work.

## High Review Notes
- Exact commands still bypass the LLM path.
- The LLM layer does not call helpers or Mineflayer APIs directly.
