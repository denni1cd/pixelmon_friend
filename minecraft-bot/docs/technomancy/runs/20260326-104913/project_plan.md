# Project Plan

## Milestones
1. `milestone_1`
   Scope: crafting command routing, recipe-driven helper expansion, crafting capabilities, placement/memory integration, tests, and run verification.

## Sequencing
- Single milestone only. Same-tree execution is appropriate because all touchpoints are tightly coupled and sequential integration is lower risk than worktree isolation for this repo size.

## Allowed Touchpoints
- `src/bot/command-parser.js`
- `src/bot/helpers.js`
- `src/bot/resource-utils.js`
- `src/bot/capabilities/**`
- `test/**`
- `docs/technomancy/runs/20260326-104913/**`

## Sensitive Touchpoints
- Existing storage helpers used by deposit and wood loop workflows.
- Existing chest memory state handling.
- Existing task-manager behavior and command precedence.

## Acceptance Strategy
- Add the requested crafting commands and capabilities.
- Reuse recipe discovery and existing placement helpers rather than ad hoc chat logic.
- Preserve old commands unchanged unless explicitly extended by the spec.

## Verification Strategy
- Run `npm test`.
- Add parser coverage for all new crafting commands.
- Add capability tests for crafting delegation, chest-memory update rules, and crafting status.
- Record live Minecraft verification as pending manual work.

## Integration Strategy
- Extend helpers first so existing and new workflows share the same craft/place primitives.
- Add dedicated crafting capabilities and register them in the capability index.
- Verify regressions through the existing suite plus new crafting tests.
