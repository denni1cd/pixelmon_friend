# Milestone Contracts

- `context.state` stores `homePosition` and `chestPosition` as `{ x, y, z, dimension }`.
- `set home` saves the bot's current floored position.
- `set chest` saves the looked-at chest when available, otherwise the nearest chest.
- `deposit wood` and `deposit all` use the remembered chest.
- `deposit` and `deposit nearest chest` preserve legacy nearby-chest behavior.
- `wood run` gathers logs, then deposits exactly the amount gathered into the remembered chest.
