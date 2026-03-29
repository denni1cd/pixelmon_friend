# Milestone Contracts

## Intent Schema
- Normalized shape:
  - `action`: required canonical allowlisted action id
  - `args`: optional object containing only supported keys for the selected action
- Invalid JSON, unknown actions, or unsupported keys must be refused before execution.

## Allowlisted Actions
- `gather_wood`
- `wood_run`
- `cobble_run`
- `deposit`
- `go_home`
- `inventory`
- `status`
- `craft_planks`
- `craft_sticks`
- `craft_crafting_table`
- `craft_chest`
- `craft_wooden_axe`
- `craft_wooden_pickaxe`
- `craft_stone_axe`
- `craft_stone_pickaxe`

## Router Contract
- Exact commands remain the first path and are executed without LLM involvement.
- Only non-command chat may enter natural-language classification.
- Natural-language execution must resolve through the registry/task-manager path only.
- Ordinary conversation remains on the short chat reply path and must not execute tasks.

## Validation Contract
- Counts normalize to deterministic defaults when omitted.
- Unsupported intents produce concise refusal messages.
- LM Studio failures or malformed payloads must fall back safely without blocking exact commands.

## Unresolved Risks
- Classification heuristics must not accidentally route ordinary conversation into task execution.
- Busy-state behavior must remain accurate when natural-language execution is attempted during an active task.
