# Spec Intake

## Objective Summary
Extend the current modular Minecraft worker bot with a deterministic tool progression and cobblestone resource loop. Phase 4 must add wooden and stone axe/pickaxe crafting, best-tool equipping, cobblestone gathering and deposit behavior, and stone tool upgrades while preserving all existing wood, chest, crafting, and chat flows.

## Key Constraints
- Keep the current capability registry, task-manager, helper, and chat-router architecture.
- Preserve LM Studio as chat-only behavior.
- Preserve existing home/chest memory and wood workflows.
- Keep the implementation deterministic and command-driven.
- Store all Technomancy artifacts under `docs/`.

## Likely Risk Zones
- Shared helper changes can easily regress phase 3 crafting and phase 2 deposit behavior.
- Tool-equipping and auto-crafting must not leave tasks stuck or race with active gather flows.
- Stone gathering can fail on reachable-vs-visible block mismatches.
- Deposit composition for cobblestone must not broaden or break existing wood deposit semantics.

## Protected Invariants
- Existing wood gathering, wood run, deposit, and crafting commands must remain valid.
- Home and chest memory must survive failures.
- No freeform LLM planner behavior may be introduced.
- The codebase must remain modular instead of collapsing into a single runtime script.

## End-to-End Expectations
- Explicit commands craft wooden and stone axe/pickaxe tools.
- `equip axe` and `equip pickaxe` choose the best supported available tool.
- `cobble <n>` gathers reachable cobblestone, returns to the saved chest flow, and deposits the gathered stone.
- `stone tools` upgrades to stone axe and stone pickaxe when materials exist.
- Failures report clearly and return the bot to idle.

## Spec Ambiguities
- `cobble` is implemented as a cobblestone-focused loop that targets stone/cobblestone sources and counts deposited cobblestone.
- `stone tools` should craft only missing supported stone tools rather than duplicating tools already present.
- The spec requires manual verification, but that remains blocked in this environment and must be recorded honestly as pending.
