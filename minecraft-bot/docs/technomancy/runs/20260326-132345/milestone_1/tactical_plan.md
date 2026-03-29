# Tactical Plan

## Scope
- Harden the authoritative task lifecycle.
- Expand runtime state only where status/debugging needs it.
- Improve cancellation cleanup and remembered state consistency.
- Add structured logs for lifecycle and inventory/state transitions.

## Touchpoints
- `src/bot/task-manager.js`
- `src/bot/state.js`
- `src/bot/logger.js`
- `src/bot/helpers.js`
- `src/bot/app.js`
- task-oriented capability files under `src/bot/capabilities/**`
- `test/task-manager.test.js`
- `test/status-capability.test.js`

## Exit Criteria
- Busy/refusal behavior is deterministic.
- Cancellation returns the bot to idle.
- Status reports current task, remembered positions, preferred tools, and last failure.
- Structured logging is wired through runtime entry points.
