# Spec Intake

## Objective Summary
Implement Phase 2 of the worker bot by extending the Phase 1 modular Mineflayer architecture with an in-memory wood resource loop. The bot must remember a home location and a chest target, expose explicit commands for setting and querying that memory, return to home on demand, deposit wood into the remembered chest, and run a composed `wood run` workflow that gathers wood and deposits it before reporting completion.

## Key Constraints
- Keep runtime local-only with Mineflayer on vanilla `1.21.11` through Prism LAN.
- Preserve LM Studio chat replies through the existing local endpoint and current model.
- Preserve explicit deterministic chat command routing; no freeform LLM worker planning.
- Preserve the modular capability registry and single-active-task architecture from Phase 1.
- Store all Technomancy artifacts under `docs/`.

## Likely Risk Zones
- Chest memory is brittle if the saved block is removed, obstructed, or replaced.
- A composed `wood run` can expose nested task-manager or capability-composition flaws.
- Command parser expansion can regress current working commands if precedence is wrong.
- Deposit logic currently assumes nearby storage; remembered-chest behavior must not break legacy deposit flows.

## Protected Invariants
- Existing commands must keep functioning.
- LM Studio remains chat-only and does not select worker tasks.
- The bot must return to a stable idle state after any failure.
- The codebase must remain modular and avoid collapsing back into a monolithic runtime file.

## End-to-End Expectations
- `set home` stores the bot's current position and confirms it.
- `set chest` stores a reachable chest target and confirms it.
- `where is home` and `where is chest` report the remembered coordinates.
- `go home` pathfinds to the remembered location.
- `deposit wood` deposits carried wood into the remembered chest.
- `wood run <n>` gathers wood, returns to the remembered dropoff, deposits it, and reports completion.

## Spec Ambiguities
- `set chest` does not fully define whether the selected chest is the looked-at block or the nearest reachable chest. Implementation will prefer the looked-at chest when valid, then fall back to the nearest chest, and this will be documented.
- `wood run` does not require visiting home before deposit. Implementation will deposit directly to the remembered chest; home remains an explicit separate target for `go home`.
- The final completion gate asks for a live manual Prism/LAN run. That cannot be honestly completed in this non-interactive environment and must be recorded as pending manual verification.
