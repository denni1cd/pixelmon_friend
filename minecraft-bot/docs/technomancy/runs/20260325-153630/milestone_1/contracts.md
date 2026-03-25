# Milestone Contracts

## Local Interfaces
- Chat commands:
  - `stash wood`
  - `stash wood <n>`
- Existing commands remain unchanged.

## Runtime Expectations
- If `activeTask` is set, stash commands must report that the bot is busy.
- The stash flow gathers enough logs to both satisfy the requested storage amount and cover any required chest-creation overhead.
- The deposit step uses a nearby or newly placed chest.

## Assumptions
- Mineflayer recipe lookup remains the source of truth for craftability.
- Nearby placement can be satisfied by finding air above a solid support near the bot.
- The bot has permission to interact with and place containers in the world.

## Unresolved Risks
- Chest full/inaccessible cases are runtime-dependent.
- World terrain may provide no safe placement surface in the search radius.
- Live pathfinding and interaction cannot be fully verified offline.
