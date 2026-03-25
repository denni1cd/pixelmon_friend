# Cross-Milestone Contracts

This run has one milestone only, so there are no cross-milestone interfaces to coordinate.

## Shared Contracts
- `index.js` remains the sole production entrypoint.
- `activeTask` continues to gate long-running bot work.
- User-facing chat commands remain lowercase string matches on chat input.

## File Boundary Notes
- Production behavior may change in `index.js`.
- Optional tests may be added under `test/` with no runtime impact on the bot.

## Contract Drift Decisions
- None at project level.
- Any milestone-local scope change must be captured in the milestone `contracts.md`.
