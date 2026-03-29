# Cross-Milestone Contracts

Only one milestone exists in this run. This index records the project-level contracts that phase 3 must preserve.

## Command Contract
- Existing commands remain valid.
- New commands:
  - `craft planks`
  - `craft planks <count>`
  - `craft sticks`
  - `craft sticks <count>`
  - `craft crafting table`
  - `craft chest`
  - `place crafting table`
  - `place chest`
  - `craft status`

## Capability Contract
- New crafting modules must keep the existing capability shape:

```js
{
  name,
  aliases,
  description,
  async execute(context, command) { ... }
}
```

## Helper Contract
- Recipe and placement logic lives in `src/bot/helpers.js`.
- Existing deposit and resource-loop capabilities may continue to reuse helper functions after crafting changes.

## Memory Contract
- Only intentional successful `place chest` updates the remembered chest position.
- Failed crafting or failed placement does not overwrite saved home or chest state.

## Task Contract
- New crafting commands must use `TaskManager`.
- After failure, task state returns to idle.
