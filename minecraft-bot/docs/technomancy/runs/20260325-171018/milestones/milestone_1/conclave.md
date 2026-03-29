# Milestone 1 Conclave

## Tactical Notes
- Favor small shared modules over a deep folder hierarchy; the repo is small.
- Preserve current behavior before adding capability richness.
- Keep the capability contract simple enough that tests can exercise it with mocked context.

## Risks
- Shared helper extraction can accidentally change Mineflayer timing behavior.
- Pathfinding state and task-manager state must stay aligned during `stop`.
