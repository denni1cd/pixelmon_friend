# Risk Notes

## Primary Risks
- Cancellation is only partially cooperative today; some capabilities rely on Mineflayer side effects stopping rather than explicit abort checks.
- Status currently reads live bot fields directly and has no shared failure memory, so hardening can drift unless one contract is chosen first.
- Router confirmations, capability messages, and task-manager outcomes can easily duplicate or contradict each other if logging and messaging are not separated carefully.
- Remembered crafting-table and preferred-tool state do not exist yet, so introducing them must not break existing crafting/equip loops.

## Mitigation Direction
- Keep `TaskManager` as the single busy/active-task authority and let it write lifecycle snapshots into runtime state.
- Add only localized state fields needed by status, cancellation, and debugging.
- Normalize intent payloads into deterministic schemas with explicit refusal reasons before capability lookup.
- Instrument routing and task transitions through one structured logger interface shared from app context.

## Decisions
- Last failure persists until the next successful managed task clears it.
- `stop` and `cancel` are equivalent deterministic commands.
- Conversational status variants should map to the same deterministic `status` capability when possible, avoiding the LLM for simple availability questions.

## Residual Risk
- Mineflayer pathing and container interactions can still fail nondeterministically in-world. This run can harden reporting and cleanup more than it can guarantee perfect world interaction.
