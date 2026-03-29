# Cross-Milestone Contracts

Only one milestone exists in this run. This contract index therefore records the project-level runtime contracts that implementation must preserve.

## Shared Runtime State
Recommended contract:

```js
{
  homePosition: { x, y, z, dimension } | null,
  chestPosition: { x, y, z, dimension } | null
}
```

Rules:
- State is in-memory only for this phase.
- State survives command failures unless explicitly overwritten.
- Coordinate records must use normalized integer positions plus dimension metadata when available.

## Command Routing Contract
- Existing commands must remain valid.
- New commands:
  - `set home`
  - `set chest`
  - `go home`
  - `where is home`
  - `where is chest`
  - `deposit wood`
  - `deposit all`
  - `wood run`
  - `wood run <n>`
- `deposit` and `deposit nearest chest` remain legacy nearby-chest deposit commands.

## Capability Contract
Each capability must continue to expose:

```js
{
  name,
  aliases,
  description,
  async execute(context, command) { ... }
}
```

Internal extension allowed:
- capabilities may expose a reusable helper method for composition as long as `execute` remains stable and external routing still goes through the registry.

## Task Contract
- The single-active-task rule remains authoritative.
- A capability invoked directly from chat must not leave `TaskManager` stuck after success, failure, or cancellation.
- Composed workflows must not create overlapping active tasks.

## Chest Resolution Contract
- Remembered chest commands must use the saved chest position.
- Legacy deposit commands may continue using nearby chest search.
- If the saved chest is missing, not a chest anymore, or in another dimension, the capability must fail clearly.

## Contract Drift Decisions
- No persistence-to-disk contract is added in Phase 2.
- No LLM planner contract is added in Phase 2.
