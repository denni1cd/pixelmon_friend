# Task 1 Handoff

## Task
Implement the allowlisted intent schema, validation/normalization helpers, and LM Studio structured intent prompt/parse path.

## Files Changed
- `src/bot/intent-catalog.js`
- `src/bot/intent-router.js`
- `src/bot/lm-studio.js`
- `test/intent-routing.test.js`

## Summary
- Added a centralized allowlisted action catalog with deterministic arg defaults and validation.
- Added a bounded intent-classification helper that keeps exact commands ahead of the LLM path.
- Extended the LM Studio client with a structured JSON intent-classification path separate from ordinary chat replies.
- Added unit coverage for validation, refusal behavior, conversation classification, and safe fallback on LLM failure.

## Commands Run
- `npm test`

## Results
- Full suite passed locally: `46/46`
- Simulated LM Studio failure path logs an expected console error during tests because the router records the exception before returning a safe refusal.

## Known Limitations
- Chat-loop integration is not part of this task and remains for task 2.

## High Review Notes
- Exact-command precedence remains unchanged at the helper/router layer.
- The validation layer now provides a stable contract for router integration.
