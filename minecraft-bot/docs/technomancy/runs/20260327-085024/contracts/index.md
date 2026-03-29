# Cross-Milestone Contracts

## Shared Tool Contract
- Stable tool definitions live in `src/bot/tool-runtime/tool-definitions.js`.
- Snapshot copies live in `docs/contracts/tool_definitions/*.json`.
- Tool execution returns normalized envelopes from `src/bot/tool-runtime/result.js`.

## Shared State Contract
- Shared runtime state remains authoritative in `src/bot/state.js`.
- Objective state now includes active objective metadata, active tool, recent tool history, retry counts, and stuck metadata.

## Runtime Boundaries
- Chat, maintenance loops, planner objectives, and MCP calls all converge on `createToolRuntime`.
- `TaskManager` remains the only authority for busy-state and cancellation.
- Capabilities remain as compatibility adapters and fallbacks, not the planner-facing contract surface.

## Drift Decisions
- No raw Mineflayer or helper functions were exposed directly through MCP.
- Objective planning remains deterministic-first for this run.
