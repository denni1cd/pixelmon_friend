# Spec Intake

## Objective Summary
Refactor the bot into a tool-runtime-first architecture with explicit contracts, deterministic policy gating, bounded objective execution, deterministic recovery, and an MCP-facing adapter over the approved tool surface.

## Key Constraints
- Preserve Node.js, Mineflayer, helpers, and `TaskManager`.
- Preserve useful existing command and bounded-intent behavior.
- Do not expose raw Mineflayer APIs directly to planners or MCP clients.
- Keep autonomy bounded and tool-driven.

## Protected Invariants
- Busy-state and cancellation remain authoritative through `TaskManager`.
- Remembered state for home, chest, and crafting table stays in shared runtime state.
- Existing useful workflows remain accessible during migration.

## Risk Zones
- Capability tests and direct capability callers must not break while chat entrypoints migrate.
- MCP must not bypass policy or task mediation.
- Objective recovery must stay bounded and observable.

## End-to-End Expectations
- Chat commands route through the new runtime for migrated workflows.
- Tool calls return normalized envelopes.
- Objective execution stays bounded.
- MCP calls use the same runtime surface.

## Ambiguities Resolved
- Planner execution starts deterministic-first and may later absorb LM Studio proposals.
- Capabilities are adapted behind tools rather than fully deleted in this phase.
