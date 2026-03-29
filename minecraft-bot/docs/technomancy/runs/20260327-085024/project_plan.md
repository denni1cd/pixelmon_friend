# Project Plan

## Milestones
1. `milestone-1`: internal tool contracts, registry, policy gate, shared state extensions, migrated tool handlers.
2. `milestone-2`: bounded objective runner and deterministic recovery.
3. `milestone-3`: MCP adapter, thin stdio server wrapper, and command/runtime rewiring.

## Sequencing
- Milestone 1 first and contract-stable before downstream work.
- Milestone 2 starts after tool definitions and policy surface are stable.
- Milestone 3 starts after the tool runtime exists and can overlap late verification once interfaces stop moving.

## Sensitive Touchpoints
- `src/bot/app.js`
- `src/bot/chat-runtime.js`
- `src/bot/state.js`
- `src/bot/task-manager.js`
- `src/bot/capabilities/*.js`

## Acceptance Strategy
- Preserve existing tests.
- Add direct runtime coverage for tool envelopes, policy gating, objectives, recovery, and MCP.
- Keep migrated entrypoints working through both chat and direct capability usage.

## Verification Strategy
- `npm test`
- Inspect generated tool contract snapshots under `docs/contracts/tool_definitions`
- Smoke the MCP adapter through `tools/list` and `tools/call`

## Integration Strategy
- Reuse the existing helper and capability substrate.
- Prefer additive layers and thin adapters over a destructive rewrite.
- Keep one internal runtime as the authoritative tool surface.
