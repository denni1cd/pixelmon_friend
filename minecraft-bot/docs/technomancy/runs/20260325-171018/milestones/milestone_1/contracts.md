# Milestone 1 Contracts

## Inputs
- Player chat messages.
- Live Mineflayer bot state and inventory.

## Outputs
- Routed command execution through capability modules.
- Stable task-state transitions and concise in-game responses.

## Invariants
- Only one worker task runs at a time.
- `stop` always clears the task manager and pathfinder goal state.
- LM Studio remains accessible only through `bot, ...` chat commands.
- Preserved commands keep their existing user-facing phrases where practical.
