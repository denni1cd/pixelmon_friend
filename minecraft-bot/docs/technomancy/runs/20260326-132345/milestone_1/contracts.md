# Milestone 1 Contracts

## Task State Contract
`TaskManager` owns the active task and writes lifecycle snapshots into runtime state.

States used in this run:
- `idle`
- `starting`
- `running`
- `persistent`
- `cancelling`

## Failure Contract
- Managed task failures resolve to `{ ok: false, message, data.failure }`.
- Last failure persists until the next successful managed task clears it.
- Cancellation is not recorded as a failure.

## Memory Contract
- Home, chest, and crafting-table positions are normalized to integer coordinates plus dimension.
- Preferred tool memory stores the last successfully equipped supported axe/pickaxe.
