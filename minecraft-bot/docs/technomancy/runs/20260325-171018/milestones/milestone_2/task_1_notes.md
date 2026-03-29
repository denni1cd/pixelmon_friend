# Task 1 Notes

## Scope
- New Phase 1 worker capabilities.

## Changes
- Added capability modules for `status`, `goto`, `stone`, and `drop all`.
- Added shared resource definitions and parser helpers to support capability extension cleanly.

## Outcome
- The refactored bot now exposes the required new Phase 1 commands without enlarging a single-file command handler.
