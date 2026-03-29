# Milestone 1 Contracts

- `createToolRuntime(context)` is the authoritative runtime assembly point.
- `executeTool`, `executeObjective`, and `executeLegacyCommand` are the public runtime entrypoints.
- Tool definitions remain planner-safe and mid-level.
- Capability files may call the runtime, but they must retain a fallback path for direct callers.
