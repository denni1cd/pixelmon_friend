# Milestone Plan

## Objective
Add the phase 3 crafting foundation without regressing the phase 2 worker flows.

## Scope
- Add parser support for crafting commands.
- Add recipe-driven helper support for planks, sticks, crafting tables, and chests.
- Add explicit crafting and placement capabilities.
- Preserve deposit/resource-loop compatibility.
- Add tests and verification notes.

## Contract-Sensitive Areas
- `src/bot/helpers.js`
- `src/bot/command-parser.js`
- `src/bot/capabilities/index.js`
- chest memory behavior in placement flows

## Task Groups
1. Contract and command routing
2. Helper implementation and memory-safe placement
3. Capability integration, tests, and verification

## Verification Plan
- Run `npm test`.
- Confirm parser coverage for new commands.
- Confirm intentional chest-memory update rules through tests.
- Record manual Minecraft verification as pending.
