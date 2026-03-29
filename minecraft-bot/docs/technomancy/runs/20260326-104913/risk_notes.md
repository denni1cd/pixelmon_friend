# Risk Notes

- Recipe discovery can fail if the current inventory does not yet satisfy a recipe; helper sequencing must account for prerequisite planks and crafting tables before attempting downstream crafts.
- Shared placement logic affects both the new crafting commands and the existing storage flow, so regressions here would have broad behavioral impact.
- Chest memory must remain unchanged on failed placement attempts.
- Live pathfinding and placement behavior still require manual verification in the Prism/LAN world.
