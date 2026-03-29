# Spec Intake

## Run
- `run_id`: `20260325-171018`
- `project_root`: `minecraft-bot`
- `spec_path`: `minecraft-bot/pixelmon_pal_phase1_spec.md`
- `artifact_root`: `minecraft-bot/docs/technomancy/runs/20260325-171018`

## Objectives
- Refactor the Mineflayer bot from a monolithic `index.js` into a modular capability-oriented worker bot.
- Preserve the current local Prism/LAN join flow, LM Studio chat path, and existing commands.
- Add explicit modular capabilities for status, goto, stone gathering, and dropping carried materials.
- Keep task execution single-threaded through a stable task manager contract.

## Current Repo State
- Product code is concentrated in `minecraft-bot/index.js`.
- Pure helpers exist only in `minecraft-bot/wood-utils.js`.
- Automated coverage is minimal and currently limited to `minecraft-bot/test/wood-utils.test.js`.
- Existing Technomancy artifacts live under `minecraft-bot/docs/technomancy/runs/`.

## Acceptance Mapping
- Preserve: `bot, <message>`, `follow me`, `stop`, `come here`, `inventory`, `wood`, `wood <n>`, `drop wood`, `pile wood`.
- Add: `status`, `goto <x> <y> <z>`, `stone`, `stone <n>`, `drop all`.
- Optional: `deposit` only if it remains localized and does not destabilize the refactor.
- Automated checks must cover command parsing, registry lookup, task state transitions, and at least one capability smoke path.

## Constraints
- Keep all Technomancy artifacts under `minecraft-bot/docs`.
- Runtime stays local-only with offline auth and LM Studio at `http://127.0.0.1:1234/v1`.
- No Pixelmon logic, no autonomous LLM task planning, no framework rewrite.

## Decisions
- Defer chest deposit for this run unless implementation stays clean after the core refactor; the spec marks it optional and Phase 1 already has enough mandatory surface area.
- Use two milestones:
  1. runtime architecture, command routing, task manager, preserved commands
  2. new capabilities, tests, verification, and integration notes

## Risks To Track
- Refactor regression in existing commands due to moving Mineflayer behavior into modules.
- Task cancellation may not interrupt all Mineflayer operations uniformly.
- Stone collection may require tool handling assumptions; the capability should fail cleanly rather than improvise unsafe behavior.
