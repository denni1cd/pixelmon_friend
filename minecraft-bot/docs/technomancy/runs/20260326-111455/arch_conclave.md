# Arch Conclave

## Milestone Authorization
- `milestone_1` authorized for same-tree execution.
- `milestone_2` authorized only after `milestone_1` contracts are integrated.

## Strategic Decisions
- The spec suggested two High agents. The run keeps two milestones, but they remain sequential because the helper, parser, and capability files overlap too heavily for safe parallel same-tree edits.
- Worktree isolation was not selected because the repo is small and the milestone dependency is strict; sequential same-tree integration is simpler and less error-prone here.

## Contract Decisions
- Tool preference is centralized in shared helper and resource-utils contracts, not duplicated in capability files.
- Cobblestone deposit composes the existing deposit capability with a stone-specific resource mode instead of introducing a parallel chest-deposit implementation.
- Existing wood/chest/crafting command semantics are protected and may only be extended, not rewritten.

## Blockers
- Manual Prism/LAN verification cannot be completed in this environment and must remain an explicit follow-up item.

## Integration Status
- Strategic planning complete.
- Implementation and milestone verification pending.
