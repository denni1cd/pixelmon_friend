# Milestone Contracts

## Cobble Workflow
- `cobble` and `cobble <count>` route through a dedicated capability.
- The capability composes existing gather and deposit boundaries instead of duplicating chest logic.
- Stone deposit must use `deposit` with `mode: 'stone'` and saved-chest targeting.

## Stone Tool Upgrade
- `stone tools` crafts missing supported stone tools only.
- Supported upgrades in this milestone are `stone_axe` and `stone_pickaxe`.
- The workflow relies on existing helper contracts for sticks, crafting-table access, and tool crafting.

## Partial Completion
- If cobblestone gathering partially succeeds, the capability reports the collected amount accurately.
- If deposit fails after gathering, the failure must be reported clearly and task state must return to idle.

## Protected Behavior
- Existing wood deposit semantics remain unchanged.
- Existing phase 3 crafting commands remain unchanged.
- Existing status, stop, inventory, and LM Studio chat routing remain unchanged.
