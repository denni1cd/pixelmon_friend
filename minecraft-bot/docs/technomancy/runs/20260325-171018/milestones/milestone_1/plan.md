# Milestone 1 Plan

## Goal
Refactor the current monolithic runtime into a modular worker-bot shell while preserving all working commands and the local join/chat flow.

## Scope
- Extract shared runtime utilities and inventory/block helpers.
- Introduce a capability registry and deterministic command router.
- Introduce a task manager with single-active-task enforcement and cancellation state.
- Preserve existing commands: LM Studio chat, follow me, stop, come here, inventory, wood, drop wood, pile wood.

## Deliverables
- Thin `index.js` bootstrap.
- Shared runtime modules for configuration, task management, chat routing, and bot helpers.
- Capability modules for preserved commands.
- Stable context contract used by later capabilities.

## Verification Target
- Existing command behavior still routes correctly.
- Task manager releases state after success, failure, and stop.
- Code is structured so Milestone 2 can add new capabilities without editing a monolithic handler.
