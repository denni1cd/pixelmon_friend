# Project Plan

## Milestones
1. `milestone_1`
   Scope: shared tool contracts, crafting/equipping helpers, parser wiring, and explicit tool capability modules.
2. `milestone_2`
   Scope: cobblestone gather/deposit loop, stone upgrade workflow, regression tests, and run verification artifacts.

## Sequencing
- `milestone_1` must land first because `milestone_2` depends on shared tool-preference, crafting, and parser contracts.
- Parallel milestone execution is not allowed. The milestones touch the same helper, parser, and capability surfaces, so same-tree sequential integration is lower risk than concurrent work.

## Allowed Touchpoints
- `src/bot/command-parser.js`
- `src/bot/helpers.js`
- `src/bot/resource-utils.js`
- `src/bot/capabilities/**`
- `test/**`
- `docs/technomancy/runs/20260326-111455/**`

## Sensitive Touchpoints
- Shared helper functions used by existing wood, chest, and crafting workflows.
- Existing deposit contract and resource filtering.
- Task-manager behavior and composed workflow boundaries.
- Existing command precedence in `src/bot/command-parser.js`.

## Acceptance Strategy
- Add tool crafting and equipping through explicit capability modules.
- Extend shared helpers for supported-tool preference and recipe-driven crafting.
- Reuse deposit and gather capability boundaries for the cobblestone loop rather than cloning logic.
- Verify all new commands and regression expectations through tests first, then document manual Minecraft checks separately.

## Verification Strategy
- Run `npm test`.
- Add parser tests for all new tool and cobble commands.
- Add unit tests for tool-preference and crafting prerequisite behavior.
- Add capability-level tests for tool crafting, equipping, and cobble-loop composition.
- Record manual Prism/LAN verification as pending if it cannot be run here.

## Integration Strategy
- Freeze shared contracts in `milestone_1`.
- Integrate `milestone_1` helper and parser changes before composing the cobble loop.
- Use same-tree execution for both milestones because the repo is small and the core files overlap heavily.
