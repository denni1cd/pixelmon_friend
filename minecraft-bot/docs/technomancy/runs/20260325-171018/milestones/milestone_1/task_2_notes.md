# Task 2 Notes

## Scope
- Preserved command capabilities.
- Thin bootstrap entrypoint.

## Changes
- Replaced the old monolithic `index.js` with a bootstrap that calls the runtime factory.
- Added capability modules for LM Studio chat, follow, stop, come here, inventory, wood gathering, and wood drop.

## Outcome
- Existing command behavior is routed through explicit modules and shared contracts.
