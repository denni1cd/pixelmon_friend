# Cross-Milestone Contracts

Only one milestone exists in this run. This index records the project-level contracts phase 5 must preserve and extend.

## Routing Contract
- Exact commands remain the first routing path.
- Only messages that are not exact commands may enter the natural-language classifier.
- The classifier must distinguish:
  - `exact_command`
  - `bounded_task_request`
  - `conversation`
- Conversation stays on the ordinary LM Studio reply path and must not execute tasks.

## Intent Schema Contract
Allowed normalized payload shape:

```json
{
  "action": "gather_wood",
  "args": {
    "amount": 32
  }
}
```

Rules:
- `action` is required and must be an explicit allowlisted identifier.
- `args` is optional but, when present, must be an object with only supported keys for that action.
- Counts normalize to existing deterministic capability defaults when omitted.

## Allowlist Contract
Initial supported natural-language action targets are limited to existing implemented capabilities/workflows:
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

Optional aliases may exist in prompt examples, but execution must normalize to the canonical action ids above.

## Validation Contract
- Invalid JSON, unsupported actions, malformed arguments, or out-of-scope requests never reach capability execution.
- Validation returns explicit refusal reasons suitable for concise player-facing chat.
- Validation and normalization live outside the capability modules so task logic remains unchanged.

## Execution Contract
- Validated intents execute through the existing capability registry and task manager only.
- The LLM layer may not call helpers or Mineflayer APIs directly.
- Busy-state behavior remains authoritative; routed intents do not bypass the task-manager conflict response.

## Refusal Contract
- Unsupported requests such as combat, building, exploration, or open-ended planning produce a safe refusal.
- Ambiguous or invalid requests produce "I didn't understand that request" style messages rather than guessed execution.

## Contract Drift Decisions
- No open-ended planner, tool-calling framework, or raw action generation is added in this run.
- No exact-command semantics are changed in this run.
