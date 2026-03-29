# Project Plan

## Milestones
1. `milestone_1`
   Scope: in-memory state contract, command parser extensions, remembered chest/home capabilities, composed wood loop, tests, and run verification artifacts.

## Milestone Sequencing
- Only one milestone is warranted. The repo is small, the affected surfaces are tightly coupled, and the spec itself requests mostly sequential execution.
- Task-level parallelism is allowed only where one slice handles parser/state wiring and another handles chest/deposit helper updates without overlapping edits.

## Allowed Touchpoints
- `index.js`
- `src/bot/app.js`
- `src/bot/command-parser.js`
- `src/bot/helpers.js`
- `src/bot/capabilities/**`
- new state/runtime helper modules under `src/bot/`
- `test/**`
- `docs/technomancy/runs/20260326-101823/**`

## Sensitive Touchpoints
- `src/bot/task-manager.js` because the single-active-task contract must remain intact.
- `src/bot/capabilities/deposit.js` because Phase 1 already depends on nearby chest deposit behavior.
- `src/bot/command-parser.js` because command precedence regressions would break current commands.
- `src/bot/app.js` because startup, chat routing, and shared context are runtime-critical.

## Acceptance Strategy
- Add deterministic parser coverage for all new commands.
- Add unit coverage for new memory-setting and composed workflow behaviors.
- Preserve or expand tests around task lifecycle and capability wiring.
- Record the manual LAN verification checklist explicitly, including the live `wood run` that cannot be executed automatically here.

## Verification Strategy
- Run `npm test`.
- Add focused unit tests for:
  - command parsing of home/chest/deposit/wood-run commands
  - state and remembered-target capability results
  - composed wood-loop behavior with mocked dependencies
- Document any blocked manual checks honestly.

## Integration Strategy
- Add a shared runtime state module to `context`.
- Extend the command parser for the new explicit commands while preserving legacy behavior.
- Keep capability modules as the routing boundary and expose scoped reusable logic for composition where necessary.
- Implement remembered-chest deposit without regressing existing nearby-chest deposit behavior.
- Finish with a repo-level test run and run artifacts summarizing what remains for manual LAN verification.
