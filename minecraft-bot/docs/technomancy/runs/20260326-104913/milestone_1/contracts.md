# Tactical Contracts

- `place chest` is the only command that intentionally writes chest memory.
- Crafting helpers must be callable by capabilities without bypassing `TaskManager`.
- Existing storage helpers remain compatible after the craft helper refactor.
