# Project Plan

## Milestones
1. `milestone_1`
   Scope: wood chest inspection, stock-threshold policy, one-shot maintenance workflow, optional idle maintenance mode, bounded command/intent surface, and regression verification.

## Sequencing
- Phase 7 is feature-sequential. Chest inspection and stock-policy contracts come first.
- One-shot `maintain wood` integration depends on the inspection contract and existing deposit/gather workflows.
- Idle maintenance mode is layered on after one-shot maintenance works.

## Allowed Touchpoints
- `src/bot/constants.js`
- `src/bot/state.js`
- `src/bot/helpers.js`
- `src/bot/app.js`
- `src/bot/command-parser.js`
- `src/bot/intent-catalog.js`
- `src/bot/intent-router.js`
- `src/bot/chat-runtime.js`
- `src/bot/capabilities/**`
- `test/**`
- `docs/technomancy/runs/20260326-152752/**`

## Contract Direction
- Chest stock counting is deterministic and counts stored log stacks from the remembered chest.
- The default minimum threshold is `64` logs unless an explicit bounded command/intent overrides it.
- `maintain wood` composes the existing gather and deposit contracts rather than re-implementing pathing/deposit logic.
- Maintenance mode is disabled by default and only triggers while idle.
- Equipment-safe deposit exclusions remain intact.
