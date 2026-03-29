# Milestone Plan

## Objective
Add a bounded natural-language intent layer on top of the current exact-command bot without changing exact command semantics or letting the LLM bypass the capability/task system.

## Scope
- Define the allowlisted action catalog and normalized intent schema.
- Add LM Studio structured intent prompting and parsing support.
- Add validation and normalization helpers for supported actions and arguments.
- Integrate exact-command-first chat routing with bounded natural-language task execution.
- Add automated coverage and milestone verification artifacts.

## Contract-Sensitive Areas
- `src/bot/app.js`
- `src/bot/lm-studio.js`
- exact-command precedence relative to the new natural-language path
- execution boundaries between the router, validator, registry, and task manager

## Task Groups
1. Intent schema, allowlist, structured prompt/parse support, and validation helpers
2. Chat-router integration, fallback behavior, regression tests, and milestone verification

## File Ownership Guidance
- Shared ownership: `src/bot/app.js`, `src/bot/lm-studio.js`, `test/**`
- Intent-layer ownership: new intent modules under `src/bot/**`
- Router ownership: exact-command-first handoff and player-facing refusal/confirmation behavior

## Milestone Verification Plan
- Run `npm test`.
- Add unit tests for schema validation, allowlist enforcement, defaults, and invalid-payload handling.
- Add integration-style tests for router handoff from natural language into existing capabilities.
- Record live LM Studio success/refusal checks as pending manual work if they cannot be executed here.
