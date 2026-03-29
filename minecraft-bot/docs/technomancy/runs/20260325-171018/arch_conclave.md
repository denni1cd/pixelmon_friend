# Arch Conclave

## Strategic Decisions
- Use the existing `minecraft-bot` directory as the sole product root.
- Keep runtime artifacts under `minecraft-bot/docs/technomancy/runs/20260325-171018`.
- Split work into two sequential milestones to avoid contract drift during the refactor.
- Treat chest deposit as deferred unless it remains trivial after mandatory Phase 1 scope is complete.

## Parallelism Decision
- No cross-milestone parallelism approved.
- Reason: the repo is small, the runtime is centralized, and the new capability/task contracts are foundational. Parallel edits would increase merge and regression risk without real throughput gain.

## Isolation Decision
- Same-tree execution approved for both milestones.
- Reason: overlap is manageable, Git branching/worktree overhead would exceed the value for this repo size, and all integration remains sequential.

## Milestone Authorization
- `milestone_1` is authorized immediately.
- `milestone_2` is authorized only after Milestone 1 contracts are materially implemented and stable.

## Escalation Rules
- If the refactor threatens preserved command behavior, reduce optional scope before changing contracts.
- If Mineflayer API limitations prevent safe cancellation, record the exact limitation and keep idle-state recovery explicit.
