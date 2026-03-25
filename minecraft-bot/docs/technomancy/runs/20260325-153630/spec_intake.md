# Spec Intake

## Objective Summary
- Add `stash wood` and `stash wood <n>` commands.
- The bot must gather the requested amount of wood, then store wood in a nearby chest.
- If no chest exists nearby, the bot should craft and place one when materials allow.

## Key Constraints
- Preserve existing commands unless explicitly changed.
- Reuse current helpers and command patterns where practical.
- Prefer focused helper additions over broad rewrites.
- Do not add databases, memory systems, or unrelated framework changes.

## Protected Invariants
- Existing `wood`, `wood <n>`, `drop wood`, `pile wood`, `follow me`, `come here`, `inventory`, `stop`, and `bot,` commands must keep working.
- `activeTask` remains the single guard against overlapping work.
- Inventory and chat responses should stay concise and player-facing.

## Likely Risk Zones
- Crafting and placing a chest without breaking pathfinder behavior.
- Finding an accessible nearby chest and depositing only wood items.
- Handling chest crafting prerequisites and failure messaging cleanly.
- Keeping single-file changes understandable while adding testable logic.

## End-to-End Expectations
- `stash wood` gathers a default amount and stores it.
- `stash wood <n>` gathers the requested amount and stores it.
- A nearby chest is reused when available.
- If no chest exists, the bot crafts and places a chest if possible.
- If materials are insufficient to craft a chest, the bot fails with a clear message.

## Spec Ambiguities
- The default amount for `stash wood` is not stated; use the current wood default of 8 logs to preserve command behavior symmetry.
- "Nearby" chest distance is not stated; use a modest search radius consistent with the existing log search pattern.
