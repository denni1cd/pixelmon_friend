# Project Plan

## Milestones
1. `milestone_1`
   Scope: shared task lifecycle contract, runtime state expansion, deterministic status/failure reporting, remembered crafting/tool state, structured logging hooks, and cancellation hardening across active workflows.
2. `milestone_2`
   Scope: bounded LLM intent validation hardening, exact-command status/cancel surface expansion, chat-router refusal/busy behavior, regression tests, and verification artifacts.

## Sequencing
- `milestone_1` defines the authoritative task/state/logging contract first.
- `milestone_2` may prepare tactical artifacts in parallel, but code integration should happen after the milestone 1 contract is fixed because router behavior reads shared task and failure state.

## Allowed Touchpoints
- `src/bot/app.js`
- `src/bot/task-manager.js`
- `src/bot/state.js`
- `src/bot/logger.js`
- `src/bot/helpers.js`
- `src/bot/lm-studio.js`
- `src/bot/intent-router.js`
- `src/bot/intent-catalog.js`
- `src/bot/command-parser.js`
- `src/bot/capabilities/**`
- `test/**`
- `docs/technomancy/runs/20260326-132345/**`

## Sensitive Touchpoints
- Exact-command precedence over the LLM path
- Busy-state and cancellation semantics in `TaskManager`
- Runtime memory for home/chest/crafting table
- Existing composed workflows (`wood_run`, `cobble_run`, `deposit`)
- Player-facing message duplication between router confirmations and capability/task messages

## Contract Direction
- `TaskManager` remains the single authority for active task state, busy state, last outcome, and last failure.
- Runtime state grows only enough to track current task snapshot, remembered positions, preferred tool data, and last failure.
- Status reads shared state rather than capability-local variables.
- Intent validation normalizes or refuses before registry execution.
- Logs are structured events, not ad hoc strings.

## Worktree Policy
- Same-tree mode for both milestones. The file surface is small and highly interdependent; worktree isolation would create more merge friction than safety here.

## Verification Strategy
- Unit tests for task transitions, cancellation cleanup, status formatting, and intent payload validation.
- Integration tests for exact command routing, busy-task refusal, and approved natural-language execution/refusal.
- Full `npm test` run after convergence.
- Honest manual checklist for live Prism/LM Studio behavior that cannot be exercised here.
