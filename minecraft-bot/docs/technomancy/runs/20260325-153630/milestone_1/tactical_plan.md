# Tactical Plan

## Milestone Objective
- Implement `stash wood` flows that gather wood, secure chest storage, and deposit wood while preserving current commands.

## Milestone Scope
- Add stash command parsing and validation.
- Add focused helpers for chest discovery, crafting-table access, plank/chest crafting, chest placement, and chest deposit.
- Add pure tests for stash planning logic.
- Record milestone verification and sign-off artifacts.

## Contract-Sensitive Areas
- `index.js` chat command routing
- inventory counting and `activeTask`
- Mineflayer crafting and chest APIs
- pathfinder-driven movement for placement and chest access

## Task Groups
1. Chest-flow helpers
2. Command wiring and stash orchestration
3. Automated checks and verification artifacts

## File Ownership Guidance
- Runtime flow edits may touch `index.js`.
- Helper/test additions are allowed if they reduce risk and keep the runtime file readable.
- Avoid unrelated refactors.

## Milestone Verification Plan
- Run syntax validation on JavaScript entrypoints.
- Run automated tests for pure stash planning logic.
- Record blocked runtime checks that require a live world.
