# Contract Index

- `wood_stock_summary`
  - Source: `src/bot/helpers.js`, `src/bot/state.js`
  - Shape: `{ count, target, deficit, needsRefill, checkedAt, chestPosition }`
- `maintain_wood` action
  - Source: `src/bot/command-parser.js`, `src/bot/intent-catalog.js`, `src/bot/capabilities/maintain-wood.js`
  - Shape: `{ minimumChestWood, mode: "run_once" | "auto" }`
- `wood_maintenance_state`
  - Source: `src/bot/state.js`
  - Shape: `{ enabled, minimumChestWood, lastCheck, lastStock, cooldownUntil }`
