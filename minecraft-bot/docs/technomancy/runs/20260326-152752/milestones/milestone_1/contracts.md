# Milestone Contracts

## Wood Stock Counting
- Count stored log stacks in the remembered chest using `WOOD_ITEM_NAMES`.
- Missing or invalid chest memory is a hard refusal.

## Threshold Policy
- Default minimum is `64`.
- Explicit `maintain wood <n>` overrides that run and updates shared maintenance state to the chosen threshold.

## Maintenance Workflow
- Inspect chest stock.
- If already sufficient, report and stop.
- If low, gather the deficit, deposit gathered logs into the saved chest, then re-inspect.
- Preserve equipment-safe deposit filtering.

## Maintenance Mode
- Disabled by default.
- Runs only while idle through the app timer.
- Applies cooldown after failed automatic checks.
