# Milestone 2 Contracts

## Router Contract
- Exact commands always win over LLM classification.
- Valid normalized intents map to existing capability names only.
- Invalid or unsupported payloads produce player-facing refusals and structured log events.

## Status Surface Contract
- `status`
- `what are you doing?`
- `what went wrong?`
- `are you busy?`

All route to the same deterministic status capability.

## Cancel Surface Contract
- `stop` and `cancel` are equivalent exact commands.
