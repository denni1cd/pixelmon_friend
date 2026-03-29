# Spec Intake

## Objective Summary
Implement a crafting foundation on top of the phase 2 worker bot so it can craft planks, sticks, crafting tables, and chests through explicit capabilities while preserving the existing gather, memory, deposit, and chat workflows.

## Key Constraints
- Keep the Mineflayer capability architecture intact.
- Preserve explicit deterministic chat routing.
- Preserve task locking and idle recovery.
- Keep LM Studio chat-only.
- Store all run artifacts under `docs/`.

## Likely Risk Zones
- Mineflayer recipe discovery must remain version-safe across planks, sticks, crafting tables, and chests.
- Placement helpers are shared with storage workflows, so regressions here would affect existing deposit behavior.
- Chest memory must update only on intentional successful placement.

## Protected Invariants
- Existing wood gather and wood run flows must keep working.
- Existing home and chest memory behavior must keep working.
- No freeform LLM planning is introduced.
- The project remains modular rather than collapsing back into a single runtime file.

## End-to-End Expectations
- `craft planks` and `craft sticks` succeed from available ingredients with concise chat output.
- `craft crafting table` and `craft chest` craft items into inventory.
- `place crafting table` and `place chest` place infrastructure nearby using existing placement logic.
- `place chest` updates chest memory only after successful intentional placement.

## Spec Ambiguities
- `craft chest` is implemented as inventory-only crafting; `place chest` is the explicit placement command.
- `craft sticks` may craft required planks from logs before crafting sticks so the command remains useful and deterministic.
- Manual Prism/LAN verification remains pending because this environment cannot execute a live Minecraft session.
