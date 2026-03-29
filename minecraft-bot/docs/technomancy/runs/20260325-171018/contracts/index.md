# Cross-Milestone Contract Index

## Runtime Context
- A shared context object must provide the Mineflayer bot, Minecraft data, registry lookup helpers, chat responder, logger, and task manager accessors.
- Capability modules must not create their own bot instances or own the join lifecycle.

## Capability Contract
- Each capability exports:
  - `name`
  - `aliases`
  - `description`
  - `parseArgs` when command-specific validation is needed
  - `execute(context, args)`
- `execute` must resolve to a normalized result object:
  - `ok: boolean`
  - `message: string`
  - `data?: object`

## Command Routing Contract
- Command parsing must remain explicit and deterministic.
- `bot, <message>` remains chat-only and never dispatches worker actions.
- Invalid arguments return usage guidance rather than falling through silently.

## Task Manager Contract
- Only one active worker task may run at a time.
- State flow is `idle -> running -> completed|failed|cancelled -> idle`.
- `stop` must clear pathfinder goals and request task cancellation.
- Failures must always release the task lock.

## Verification Contract
- Automated tests cover parser behavior, registry lookup, and task state transitions.
- Runtime/manual checks for Prism/LAN join and in-world gathering remain documented artifacts when not executable in-session.
