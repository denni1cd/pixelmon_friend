# Cross-Milestone Contracts

## Command Contract
- Existing commands remain valid.
- New commands:
  - `craft wooden axe`
  - `craft wooden pickaxe`
  - `craft stone axe`
  - `craft stone pickaxe`
  - `equip axe`
  - `equip pickaxe`
  - `cobble`
  - `cobble <count>`
  - `stone tools`

## Tool Contract
- Supported automatic preference for this phase is limited to:
  - axes: `stone_axe`, `wooden_axe`
  - pickaxes: `stone_pickaxe`, `wooden_pickaxe`
- Preference order is deterministic and centralized in shared helper/resource contracts.
- Capabilities must not hard-code separate tool preference rules.

## Crafting Contract
- Tool crafting must reuse phase 3 recipe-driven helper behavior.
- Shared helper functions should expose clear result objects for crafted count and total inventory count.
- Missing materials must produce explicit errors instead of silent no-ops.

## Gather Contract
- The cobble loop composes lower-level gather and deposit behavior instead of cloning chest or home logic.
- Cobblestone gathering targets reachable stone/cobblestone sources and reports partial completion accurately.
- Gather failures must leave the task-manager idle and memory intact.

## Deposit Contract
- Existing wood deposit semantics remain unchanged.
- Stone deposit uses the same chest resolution path as saved-chest deposit, with resource filtering scoped to cobblestone.

## Regression Contract
- No milestone may break:
  - chat reply routing
  - home/chest memory
  - wood gathering and wood run
  - phase 3 crafting commands
  - existing status, stop, and inventory behavior
