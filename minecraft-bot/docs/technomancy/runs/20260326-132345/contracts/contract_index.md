# Cross-Milestone Contract Index

## Task Lifecycle
- Authority: `src/bot/task-manager.js`
- Shape: shared task snapshot with `state`, `taskName`, `startedAt`, `details`, `persistent`, and `cancellable`
- Consumers: status formatting, busy refusal messaging, stop/cancel cleanup

## Runtime Memory
- Authority: `src/bot/state.js`
- Stored fields: home, chest, crafting table, preferred tools, task snapshot, last failure, last outcome
- Consumers: status/craft status helpers, placement/equip flows, verification tests

## Intent Validation
- Authority: `src/bot/intent-catalog.js`
- Rule: normalize or refuse before capability lookup; no malformed payload reaches execution
- Consumers: `intent-router`, `chat-runtime`

## Observability
- Authority: `src/bot/logger.js`
- Rule: routing, lifecycle, failure, and inventory/state transitions emit structured events
- Consumers: app runtime, task manager, helpers, LM Studio client
