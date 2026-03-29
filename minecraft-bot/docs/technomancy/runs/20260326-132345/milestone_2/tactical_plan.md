# Tactical Plan

## Scope
- Harden bounded intent validation and refusal reasons.
- Keep exact commands ahead of the LLM path.
- Add deterministic status/cancel conversational variants without broadening gameplay.
- Cover regressions for router behavior and existing workflows.

## Touchpoints
- `src/bot/intent-catalog.js`
- `src/bot/intent-router.js`
- `src/bot/chat-runtime.js`
- `src/bot/lm-studio.js`
- `src/bot/command-parser.js`
- `test/intent-routing.test.js`
- `test/command-parser.test.js`
- `test/chat-runtime.test.js`

## Exit Criteria
- Invalid intent payloads are rejected before execution.
- Status/cancel conversational variants resolve deterministically.
- LM Studio failures remain safe refusals rather than wedged routing.
- Existing exact command behavior is preserved.
