# Risk Notes

## Main Risks
- Cobblestone gathering can still fail in cramped or partially obstructed terrain even when stone is visible.
- Tool-equipping behavior depends on inventory and Mineflayer equip behavior staying synchronized with task state.
- Shared helper changes touch existing wood/chest/crafting flows, so regression risk remains concentrated in `src/bot/helpers.js`.

## Mitigations Used
- Tool preference was centralized in shared helper and resource-utils contracts instead of duplicated across capability files.
- The cobble loop composes the existing gather/deposit behavior rather than introducing a second chest-deposit implementation.
- Automated parser and capability tests were extended before final integration.

## Remaining Follow-Up
- Run the live Prism/LAN manual verification checklist for tool crafting, equipping, cobblestone gathering, deposit, and stone-tool upgrades.
