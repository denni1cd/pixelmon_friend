# Milestone Plan

## Objective
Land the shared phase 4 tool contract so downstream cobblestone workflows can rely on deterministic tool crafting, best-tool selection, and equip command routing.

## Scope
- parser routes for tool craft and equip commands
- capability registry wiring for the new tool modules
- explicit capability modules for wooden/stone axe and pickaxe crafting
- explicit equip capabilities for axes and pickaxes
- milestone-local tests for tool preference and tool command behavior

## Contract-Sensitive Areas
- `src/bot/helpers.js`
- `src/bot/resource-utils.js`
- `src/bot/command-parser.js`
- `src/bot/capabilities/index.js`

## Task Groups
1. Freeze tool preference and tool crafting contracts
2. Wire parser and capability modules
3. Add regression tests and integrate milestone artifacts

## File Ownership Guidance
- shared helper and contract files remain same-tree and non-parallel
- capability modules may be added as new files, but registry and parser integration remain sequential

## Verification Plan
- run `npm test`
- confirm parser coverage for new commands
- confirm tool preference and equip capability coverage
