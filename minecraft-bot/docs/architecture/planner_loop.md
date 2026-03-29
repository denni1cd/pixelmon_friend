# Planner Loop

## Bounded Objective Runner
`src/bot/tool-runtime/objective-runner.js` provides the bounded execution loop for tool-driven objectives.

## Current Objectives
- `maintain_wood_stock`

## Guards
- Maximum steps per objective
- Maximum repeated failures per objective
- Tool allowlists per objective
- Recovery actions counted inside the same bounded loop
- Shared state updates for current objective, active tool, and recent tool history

## Current Strategy
- Start from deterministic planning rules for stock maintenance.
- Use tool results, not raw helper calls, to decide the next step.
- Block unsupported goals cleanly instead of improvising.

## Migration Note
The loop is deliberately deterministic first. LM Studio remains the bounded classifier for chat routing and can later be added as a planner proposal source behind the same policy gate.
