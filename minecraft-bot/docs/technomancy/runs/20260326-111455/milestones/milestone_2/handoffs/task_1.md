# Task 1 Handoff

## Task
Implement the cobble gather/deposit workflow and the stone-tools upgrade capability, including parser and registry wiring.

## Files Changed
- `src/bot/command-parser.js`
- `src/bot/capabilities/index.js`
- `src/bot/capabilities/deposit.js`
- `src/bot/capabilities/cobble-run.js`
- `src/bot/capabilities/stone-tools.js`
- `test/command-parser.test.js`
- `test/crafting-capabilities.test.js`

## Summary
- Added `cobble` / `cobble <count>` parsing and the `stone tools` route.
- Added the composed `cobble_run` capability that ensures and equips a pickaxe, gathers cobblestone, and deposits it through the existing saved-chest deposit path.
- Added the `stone_tools` capability that crafts missing supported stone tools only.
- Extended deposit success messaging for `mode: 'stone'`.
- Added automated coverage for the new parser routes and capability composition.

## Commands Run
- `npm test`

## Results
- Passed: `37/37` tests

## Known Limitations
- Live Prism/LAN verification for actual cobblestone mining and deposit remains manual.

## Review Notes
- Composition stays within existing gather/deposit/task-manager boundaries.
- Existing wood/chest/crafting flows were preserved by full-suite regression coverage.
