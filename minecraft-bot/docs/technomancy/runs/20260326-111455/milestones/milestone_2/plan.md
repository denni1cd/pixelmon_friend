# Milestone Plan

## Objective
Implement the cobblestone gather/deposit workflow and the stone-tools upgrade capability on top of the stabilized tool contracts from milestone 1, while preserving all existing wood, chest, and crafting behavior.

## Scope
- Add parser and capability support for `cobble`, `cobble <count>`, and `stone tools`.
- Compose cobblestone gathering with the existing gather and deposit capability boundaries.
- Add a deterministic stone-tool upgrade workflow that crafts missing stone axe / stone pickaxe when materials exist.
- Add regression-focused tests and verification artifacts.

## Contract-Sensitive Areas
- `src/bot/command-parser.js`
- `src/bot/capabilities/index.js`
- `src/bot/helpers.js`
- `src/bot/resource-utils.js`
- composed interaction with `src/bot/capabilities/deposit.js`

## Task Groups
1. Cobble loop command and capability composition
2. Stone-tools upgrade capability and parser wiring
3. Regression tests and milestone verification

## File Ownership Guidance
- Shared helper/parser surfaces are single-owner within this milestone to avoid same-tree conflicts.
- Capability files for `cobble` and `stone tools` may be added alongside tests in one integrated change.
- Verification artifacts should be updated after code and test results are known.

## Milestone Verification Plan
- Run `npm test`.
- Add parser coverage for `cobble`, `cobble <count>`, and `stone tools`.
- Add capability tests for cobble loop composition and stone-tool upgrade behavior.
- Record live Prism/LAN validation as pending manual work if it cannot be executed here.
