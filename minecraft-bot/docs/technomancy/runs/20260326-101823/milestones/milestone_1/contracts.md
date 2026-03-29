# Milestone Contracts

## Local Interfaces
- `context.state` must provide getters/setters or direct fields for remembered home/chest coordinates.
- `context.helpers` may grow state-aware location and chest helpers, but existing helper behavior must remain available.
- New capability modules must return normalized `{ ok, message, data }` results.

## Upstream Inputs
- Existing Phase 1 runtime and capability registry.
- Existing helper functions for resource collection and chest interaction.
- Existing task-manager single-active-task lifecycle.

## Downstream Outputs
- Parser routes new explicit commands into registry-resolved capabilities.
- Remembered deposit and wood loop capabilities produce concise player-facing chat messages.
- Tests cover parser and composed workflow regressions.

## Assumptions
- The bot can access dimension data from Mineflayer when spawned.
- Using current bot position for `set home` is acceptable and deterministic.
- Saving the looked-at chest first, then falling back to nearest chest, is acceptable if documented.

## Unresolved Contract Risks
- Nested task execution must be avoided or explicitly handled.
- Saved chest validation must distinguish between "missing memory" and "saved block is no longer a chest."
