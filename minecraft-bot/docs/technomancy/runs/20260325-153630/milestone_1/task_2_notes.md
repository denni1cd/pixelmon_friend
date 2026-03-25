# Task 2 Notes

## Task
- Command wiring, gather-then-stash behavior, deposit behavior, and error handling

## Files Changed
- `index.js`
- `package.json`
- `test/wood-utils.test.js`

## Implementation Summary
- Replaced duplicated `wood` amount parsing with a shared parser.
- Added `stash wood` and `stash wood <n>` command handling.
- Added a gather-then-stash flow that accounts for chest-creation overhead before deposit.
- Added automated tests for stash command parsing and chest-material planning.

## Commands Run
- `npm test`

## Results Observed
- All 7 focused automated tests passed.

## Known Limitations
- Tests cover pure planning logic and parsing, not live Mineflayer movement or block interaction.

## High Review Notes
- Existing wood-related commands were preserved and routed through the same parser logic.
