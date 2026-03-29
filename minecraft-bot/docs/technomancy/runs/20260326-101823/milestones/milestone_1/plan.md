# Milestone Plan

## Objective
Extend the Phase 1 modular bot into a usable wood worker loop by adding in-memory home/chest memory, remembered deposit behavior, a composed `wood run`, and the verification coverage required by the spec.

## Scope
- Add runtime state for remembered home and chest targets.
- Add parser and capability support for setting, querying, and using those targets.
- Add remembered-chest deposit logic.
- Add a composed wood loop using existing gather/deposit logic instead of duplicating behavior.
- Add automated tests and run artifacts.

## Contract-Sensitive Areas
- `context` shape in `src/bot/app.js`
- task-manager interaction within composed workflows
- parser precedence in `src/bot/command-parser.js`
- deposit helper behavior in `src/bot/helpers.js` and `src/bot/capabilities/deposit.js`

## Task Groups
1. Runtime memory and command wiring
2. Remembered chest resolution and deposit path
3. Composed wood loop plus tests and verification

## File Ownership Guidance
- Shared ownership: `src/bot/app.js`, `src/bot/command-parser.js`, `src/bot/helpers.js`, `test/command-parser.test.js`
- State-focused ownership: new state helper module and home/chest capability modules
- Loop-focused ownership: `src/bot/capabilities/deposit.js`, new `wood-run` capability, composed-workflow tests

## Milestone Verification Plan
- Run the parser and capability test suite through `npm test`.
- Confirm result normalization for new capabilities in unit tests.
- Record blocked manual Prism/LAN checks explicitly in verification artifacts.
