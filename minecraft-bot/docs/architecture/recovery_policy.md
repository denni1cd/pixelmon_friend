# Recovery Policy

## Deterministic Recovery Rules
`src/bot/tool-runtime/recovery-policy.js` handles common failure classes without delegating recovery invention to the model.

## Implemented Cases
- `NO_CHEST_SAVED` and `CHEST_MISSING`: follow up with `ensure_chest_access` when allowed.
- `PATH_FAILED`: retry or recovery follow-up under bounded rules.
- `INVENTORY_FULL`: follow up with `deposit_items` when allowed.
- `TASK_CANCELLED` and `RUNTIME_BUSY`: abort cleanly.
- Repeated identical failures: abort the objective instead of looping indefinitely.

## Observability
- Recovery decisions stay in the same tool history stream as normal tool calls.
- Objective state tracks failure streaks, retry counts, and the currently active tool.
