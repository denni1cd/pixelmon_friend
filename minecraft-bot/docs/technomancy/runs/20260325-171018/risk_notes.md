# Risk Notes

## Active Risks
- `index.js` currently combines join lifecycle, command parsing, task state, movement, LM Studio chat, and capability logic; refactor regression risk is high.
- `mineflayer-collectblock` and pathfinder cancellation are not guaranteed to stop instantly, so the task manager must recover even when a task abort is best-effort.
- Stone gathering may depend on reachable exposed blocks and available tooling; the capability should target safe, nearby blocks and fail clearly when not possible.

## Scope Control
- Mandatory Phase 1 features take priority over optional chest deposit.
- No Pixelmon, planner, or autonomous behavior is allowed in this run.

## Verification Gaps
- Live Prism/LAN behavior cannot be fully verified in this shell session.
- Manual checks must remain in the final artifacts for join flow, real-world gathering, and stop behavior during active movement.
