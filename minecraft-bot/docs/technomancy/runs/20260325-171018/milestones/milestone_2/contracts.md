# Milestone 2 Contracts

## Inputs
- Milestone 1 runtime context and capability registry.
- Player commands for new worker behaviors.

## Outputs
- Normalized capability results for `status`, `goto`, `stone`, and `drop all`.
- Test evidence for parser and task lifecycle behavior.

## Invariants
- New capabilities must use the existing task manager rather than bespoke locks.
- Usage errors return explicit hints.
- Stone gathering must abort cleanly when no valid target is reachable.
