# Tool Runtime

## Purpose
The bot now routes approved planner-safe actions through an internal tool runtime instead of treating chat capabilities as the primary execution surface.

## Layers
- `src/bot/tool-runtime/tool-definitions.js` defines the approved tool contract surface.
- `src/bot/tool-runtime/tools.js` implements deterministic tool handlers over the existing helper and capability substrate.
- `src/bot/tool-runtime/policy.js` validates tool existence, schema, busy-state, allowlists, and preconditions before execution.
- `src/bot/tool-runtime/index.js` binds registry, policy, task mediation, objective execution, MCP exposure, and legacy command adapters together.

## Execution Model
- Read-only tools such as `inspect_inventory` and `inspect_status` may run while the runtime is busy.
- Mutating tools run through `TaskManager` unless they are invoked from inside an already-bounded objective loop.
- Every execution returns a normalized envelope with `ok`, `status`, `toolName`, `message`, `data`, `observation`, `errorCode`, `retryable`, `sideEffects`, and `metrics`.

## Compatibility
- `chat-runtime` now checks the tool runtime first for migrated commands.
- Capabilities keep fallback implementations so direct capability tests and non-runtime callers still work.
- The app's wood-maintenance timer routes through the new runtime instead of bypassing it.
