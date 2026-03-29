# Milestone 2 Plan

## Goal
Add the required Phase 1 worker capabilities and cover the new contracts with lightweight automated tests and verification notes.

## Scope
- Implement `status`, `goto`, `stone`, and `drop all`.
- Add parser tests for numeric commands and coordinate parsing.
- Add registry and task-manager tests.
- Add one mocked capability smoke test.
- Record manual verification items for local Prism/LAN play.

## Deliverables
- New capability modules.
- Expanded test suite.
- Milestone verification notes and completion summary.

## Verification Target
- New commands route and validate correctly.
- Task manager remains stable under cancellation/failure paths.
- The modular architecture supports new capability addition without modifying a giant conditional chain.
