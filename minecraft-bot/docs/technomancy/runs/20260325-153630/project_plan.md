# Project Plan

## Milestones
1. `milestone_1`: add stash-wood workflow, chest handling, command wiring, and verification.

## Sequencing
- Single milestone only.
- No worktree isolation required because the repo is one small JavaScript entrypoint and the change is tightly coupled.

## Scope Summary
- Extend the wood command surface with stash commands.
- Add helpers for chest discovery, crafting prerequisites, chest placement, and wood deposit.
- Add lightweight tests around command parsing / pure helper behavior.
- Record manual verification expectations for in-game behavior that cannot be fully automated here.

## Allowed Touchpoints
- `index.js`
- `package.json`
- `test/` if needed
- `docs/technomancy/runs/20260325-153630/**`

## Sensitive Touchpoints
- `index.js` chat handler ordering and `activeTask` lifecycle.
- Inventory/crafting logic that depends on Mineflayer APIs and the bot's loaded registry data.

## Acceptance Strategy
- Preserve all existing commands.
- Ensure stash commands map to a gather-then-store workflow.
- Ensure chest reuse is preferred over crafting.
- Ensure chest crafting failure returns a clear user-facing message.

## Verification Strategy
- Automated: unit tests for command parsing / command classification and any extracted pure helpers.
- Manual/integration notes: chest reuse, chest crafting/placement, deposit flow, and clean failure cases.

## Integration Strategy
- Keep the feature in the existing file shape, extracting only focused helpers needed for correctness and testability.
- Close the run with milestone verification, High sign-off, and Arch final summary.
