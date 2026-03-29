# Project Plan

## Milestones
1. `milestone_1`
   Scope: modular runtime shell, capability registry, command parser/router, task manager, preserved LM Studio and movement/wood commands.
2. `milestone_2`
   Scope: new worker capabilities (`status`, `goto`, `stone`, `drop all`), automated tests, verification notes, and repo integration.

## Sequencing
- Milestone 1 must complete first because Milestone 2 depends on the capability and task-manager contracts.
- After contracts are stable, Milestone 2 can execute in the same tree; worktree isolation is not warranted for this small repo but milestone integration remains sequential.

## Allowed Touchpoints
- `minecraft-bot/index.js`
- `minecraft-bot/package.json`
- `minecraft-bot/package-lock.json` only if dependency metadata changes
- `minecraft-bot/test/**`
- New source modules under `minecraft-bot/`
- `minecraft-bot/docs/technomancy/runs/20260325-171018/**`

## Sensitive Touchpoints
- Join/startup path for the local Prism LAN world.
- `stop` behavior and task lifecycle reset.
- Existing wood-gather flow and LM Studio chat path.

## Integration Strategy
- Shrink `index.js` into a thin bootstrap entrypoint.
- Move capability logic into explicit modules with a normalized `execute(context, args)` contract.
- Centralize command parsing and task orchestration so failure and cancellation always return the bot to idle.
- Add unit coverage around pure contracts first, then record manual playtest items that cannot be executed in this environment.

## Completion Gate
- Code implements the modular runtime and required capabilities.
- Automated tests pass locally.
- Run artifacts include milestone plans, contracts, task notes, verification evidence, and a final summary.
- Manual Prism/LAN checks are documented explicitly as pending or completed.
