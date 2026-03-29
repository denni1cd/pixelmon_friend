# Arch Conclave

## Milestone Authorization
- `milestone_1` authorized for same-tree execution.

## Strategic Decisions
- The phase 5 spec suggested one High agent, which remains the correct decomposition here.
- Worktree isolation was not selected. The repo is small, and the allowlist schema, LM Studio client changes, and chat-router integration overlap too tightly for a safe multi-worktree split.
- Exact-command precedence is a protected invariant and must be enforced before any natural-language routing path.

## Contract Decisions
- The natural-language layer is bounded by an explicit allowlist and normalized intent schema.
- Conversation and task execution remain separate LM Studio paths: one for ordinary replies, one for structured intent extraction.
- Execution remains registry/task-manager mediated only.
- Unsupported or malformed intents must be refused, never improvised.

## Blockers
- Manual LM Studio success-path and refusal-path demonstrations cannot be completed inside this non-interactive environment and must remain explicit follow-up verification items.

## Integration Status
- Strategic planning complete.
- Milestone execution pending.
