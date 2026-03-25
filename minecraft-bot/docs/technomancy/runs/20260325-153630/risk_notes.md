# Risk Notes

## Primary Risks
- Crafting may require a nearby crafting table depending on the recipe; the implementation needs to detect and message that clearly.
- Chest placement needs a safe reference block and an empty adjacent position.
- Depositing into a chest can fail if the bot cannot path to it, open it, or if the chest inventory is full.

## Mitigations
- Separate discovery/provisioning helpers from command routing to keep failure reasons explicit.
- Prefer nearby existing chests before crafting logic.
- Record manual verification for the Mineflayer interactions that are not practical to simulate in unit tests here.

## Residual Risk
- Exact in-world block placement behavior depends on terrain and server state, so final confidence still requires a live Minecraft check.
