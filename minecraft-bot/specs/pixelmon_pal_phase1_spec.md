# Pixelmon Pal Phase 1 - Capability Framework and Worker Upgrade

## 1. Objective
Describe the feature or change in plain language.

### Summary
Build a structured Phase 1 Minecraft worker bot from the current prototype. The bot must move from a single-file script with a few hard-coded commands into a modular capability-based program that still runs locally with Mineflayer and LM Studio. The run should preserve the current working bot, keep local Prism/LAN testing, and add a small set of reusable worker capabilities beyond wood gathering.

### Business / user goal
The current bot proves the stack works, but it is too dumb and too brittle to scale. The goal of this update is to create a real program that Technomancy can extend safely, so future capabilities can be added as modules instead of hand-editing one growing `index.js` file.

### Definition of success
This update is successful when:
- the bot still connects successfully to the local Prism-hosted vanilla 1.21.11 LAN world
- current working commands still function
- the codebase is refactored into a modular capability-oriented structure
- at least three non-trivial worker capabilities are implemented in that structure
- the bot can gather wood, gather basic stone/cobblestone, report inventory/status, and drop or deposit gathered materials through explicit commands
- Technomancy artifacts and verification notes are complete

## 2. Current state
Describe the current system behavior and relevant baseline.

### Existing behavior
The bot currently:
- runs as a Node.js script
- connects to a local vanilla 1.21.11 Minecraft LAN world hosted from Prism
- uses Mineflayer for connection and movement
- uses LM Studio locally for short chat replies through the `bot, ...` command
- supports `follow me`, `stop`, `come here`, `inventory`, `wood`, `wood <n>`, and `drop wood` / `pile wood`
- can gather nearby log blocks into inventory using `mineflayer-collectblock`

The bot is still monolithic and fragile. Chat parsing, LM Studio calls, task handling, pathing, and capability logic are mixed together in one runtime file. There is no formal capability registry, no task manager contract, and no clean extension path for new worker skills.

### Relevant files / components
- `index.js`
- `package.json`
- `package-lock.json`

### Existing constraints
- Runtime is local only for this phase.
- Minecraft test target is vanilla `1.21.11` via Prism LAN.
- Bot connection uses `auth: 'offline'` for local testing.
- LM Studio is local and reachable at `http://127.0.0.1:1234/v1`.
- Current model is `qwen_qwen3-30b-a3b-instruct-2507`.
- Existing packages already in use include Mineflayer, Mineflayer Pathfinder, Minecraft Data, and Mineflayer CollectBlock.
- The bot must remain understandable and debuggable by hand.
- This run must not jump to Pixelmon logic yet.

## 3. Requested change
Describe exactly what needs to change.

### New behavior
Refactor the current bot into a modular worker-bot architecture with a capability registry and task manager. Preserve existing commands while adding a first structured batch of worker capabilities that can be extended later by Technomancy.

The bot should support a stable command layer, a capability layer, and a thin runtime shell. New capabilities added in this run must be explicit modules rather than more ad hoc branches in a growing monolithic file.

### User-facing commands / inputs
Preserve current commands:
- `bot, <message>`
- `follow me`
- `stop`
- `come here`
- `inventory`
- `wood`
- `wood <n>`
- `drop wood`
- `pile wood`

Add these commands in this run:
- `status`
- `goto <x> <y> <z>`
- `stone`
- `stone <n>`
- `drop all`
- `deposit` or `deposit nearest chest` if a reachable chest workflow is implemented in this run

### Expected outputs
The bot must:
- reply in Minecraft chat with concise status or failure messages
- start and complete tasks through explicit commands
- report inventory and active task state on request
- gather wood into inventory
- gather basic stone/cobblestone into inventory
- drop materials at its feet when requested
- optionally deposit materials into the nearest reachable chest if chest deposit is included in this run
- write code and verification artifacts according to the Technomancy contract

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- Refactor current single-file runtime into a modular project structure.
- Create a capability registry and task manager.
- Preserve current working chat and movement commands.
- Implement modular worker capabilities for wood gathering, stone gathering, inventory/status, movement to coordinates, and material drop/deposit.
- Add lightweight verification for command parsing and capability contracts.

### Out of scope
- Pixelmon mechanics or mod-specific behavior.
- Autonomous survival or free-roaming planning.
- Combat logic.
- Full agent planning where the LLM chooses actions automatically.
- Building castles, blueprints, or complex construction.
- Screen-reading, OCR, computer-vision control, or mouse automation.
- Switching away from LM Studio or Mineflayer.

### Future scope
- Capability chaining and planner-based task selection.
- Farming, chest routing, crafting, and blueprint building.
- Pixelmon adapter layer after the core worker bot is stable.

## 5. Functional requirements
List the required behaviors.

### Requirement 1
The codebase must be reorganized so capabilities are implemented as separate modules instead of embedded directly in a monolithic command handler.

### Requirement 2
The bot must preserve current successful commands and behavior:
- chat reply through LM Studio
- follow player
- stop current action
- come to player
- gather wood
- report inventory
- drop wood

### Requirement 3
The bot must add at least these new worker capabilities:
- status reporting
- go to coordinates
- gather basic stone/cobblestone
- drop all carried materials

### Requirement 4
The bot must enforce a single active task model so overlapping worker actions do not run at the same time, and task cancellation/failure must return the bot to a stable idle state.

## 6. Technical requirements
Document implementation expectations.

### Language / framework
Node.js with Mineflayer.

### Required libraries
- `mineflayer`
- `mineflayer-pathfinder`
- `mineflayer-collectblock`
- `minecraft-data`

### Required patterns to preserve
- Preserve the current local LM Studio OpenAI-compatible call pattern.
- Preserve local Prism/LAN testing on vanilla `1.21.11`.
- Preserve a single active task lock or equivalent task-manager rule.
- Preserve explicit chat command triggers; do not move task selection to freeform LLM decisions.
- Preserve concise in-game chat feedback for success and failure.

### Forbidden changes
- Do not rewrite the project into a different framework or language.
- Do not remove LM Studio chat support.
- Do not introduce Pixelmon code in this run.
- Do not replace explicit command routing with unconstrained AI planning.
- Do not break the current working join flow for local vanilla `1.21.11` Prism LAN testing.
- Do not add broad unrelated features just because the framework now supports extension.

## 7. Data and contracts
Define any important interfaces.

### Inputs
Minecraft chat commands issued by the player.

Expected command shapes:
- `bot, <message>`
- `follow me`
- `stop`
- `come here`
- `inventory`
- `status`
- `goto <x> <y> <z>`
- `wood [count]`
- `stone [count]`
- `drop wood`
- `drop all`
- `deposit` or `deposit nearest chest` if implemented

### Outputs
- Minecraft chat messages confirming start, progress, completion, or failure
- movement and inventory side effects in the world
- modular source files for runtime, registry, utilities, and capabilities
- Technomancy run artifacts under the required docs path

### Internal contracts
Use a stable capability contract. Each capability module should expose a predictable interface, for example:

```js
module.exports = {
  name: 'gather_wood',
  aliases: ['wood'],
  description: 'Gather nearby log blocks until target count is reached.',
  async execute(context, args) {
    // returns normalized result
  }
}
```

Task results should normalize to a predictable structure such as:

```js
{
  ok: true,
  message: 'Collected 8 logs.',
  data: { collected: 8 }
}
```

The task manager must enforce:
- one active task at a time
- clear transition between idle -> running -> complete or failed -> idle
- safe reset on failure or stop

The LLM client remains chat-only in this run. It must not directly choose or execute worker capabilities.

## 8. Error handling
Describe how failure must work.

### Failure cases
- No reachable target blocks are found nearby.
- Inventory is full.
- Pathfinding fails or the bot becomes stuck.
- The user gives an invalid command or malformed arguments.
- The nearest chest is not found or is unreachable, if chest deposit is included.
- LM Studio call fails for chat reply commands.

### Required failure behavior
- Log the underlying error to the console.
- Send a short human-readable failure message in Minecraft chat.
- Clear or release the active task state.
- Do not leave the bot half-locked in a running state after failure.
- Invalid command arguments should be rejected with a usage hint instead of silent failure.

### Recovery rules
- After any failure, the bot must return to an idle state and be ready to accept new commands.
- `stop` must cancel or interrupt the active task as safely as the implementation allows.
- If a capability cannot complete because the world does not contain reachable targets, it must abort cleanly rather than loop forever.

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1
**Given:** the bot is connected to the local vanilla 1.21.11 Prism LAN world and is idle  
**When:** the player types `wood 8`  
**Then:** the bot gathers nearby log blocks, reports completion in chat, and `inventory` shows the collected wood

### Scenario 2
**Given:** the bot is connected and idle near exposed stone  
**When:** the player types `stone 16`  
**Then:** the bot gathers basic stone/cobblestone blocks, reports completion in chat, and remains responsive to follow-up commands

### Scenario 3
**Given:** the bot is currently performing a gather task  
**When:** the player types `stop`  
**Then:** the active task is cancelled or safely interrupted, the bot returns to idle, and a new command can be issued without restarting the process

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- Verify the bot still joins the local vanilla 1.21.11 Prism LAN world successfully.
- Verify `bot, hello`, `follow me`, `stop`, `come here`, `inventory`, and `wood 8` still work after refactor.
- Verify `status`, `goto <x> <y> <z>`, `stone 8`, and `drop all` work in live play.
- Verify the bot reports clear failure when no target blocks are reachable.
- Verify the bot can accept a new command after a failed or cancelled task.

### Automated verification
- Unit test command parsing for commands with optional numeric arguments.
- Unit test capability registry loading and lookup.
- Unit test task-manager state transitions for idle/running/completed/failed/cancelled.
- Smoke test one capability module with mocked bot dependencies if practical.

### Regression requirements
The refactor must not break:
- local bot connection to the vanilla 1.21.11 Prism LAN world
- LM Studio chat response path
- `follow me`
- `stop`
- `come here`
- `wood`
- `inventory`
- `drop wood`

## 11. Technomancy execution contract

### Run classification
medium

### Agent structure
- Arch Technomancer: 1
- High Technomancer: 2
- Technomancers per High: max 2

### Parallelism rules
- Architecture, contracts, and target file layout must be decided first.
- After the capability contract and task-manager contract are fixed, implementation may split in parallel across:
  - runtime/refactor wiring
  - worker capability modules
  - verification and test scaffolding
- Final integration and regression verification must remain sequential.

### Communication rules
- Arch communicates through strategic artifacts.
- High Technomancers communicate through approved shared artifacts only.
- Technomancers communicate only within their assigned milestone swarm.
- Cross-swarm coordination must escalate upward.

### Required artifacts
Arch Technomancer must produce:
- `docs/technomancy/runs/<run_id>/project_plan.md`
- `docs/technomancy/runs/<run_id>/delegation_matrix.json`
- `docs/technomancy/runs/<run_id>/risk_notes.md`

Each High Technomancer must produce:
- `docs/technomancy/runs/<run_id>/milestone_<n>/tactical_plan.md`
- `docs/technomancy/runs/<run_id>/milestone_<n>/contracts.md`
- `docs/technomancy/runs/<run_id>/milestone_<n>/task_graph.json`
- `docs/technomancy/runs/<run_id>/milestone_<n>/verification_checklist.md`

Each Technomancer must produce:
- `docs/technomancy/runs/<run_id>/milestone_<n>/task_<id>_notes.md`
- `docs/technomancy/runs/<run_id>/milestone_<n>/task_<id>_verification.md`

### Completion gates
The run is not complete until:
- code changes are implemented
- verification is documented
- milestone sign-off is written
- final Arch Technomancer summary is written
- live manual verification is recorded for the preserved commands and the new worker capabilities

## 12. Risks and assumptions

### Assumptions
- Local development continues on a vanilla `1.21.11` Prism instance opened to LAN.
- LM Studio remains available locally at `127.0.0.1:1234`.
- The bot remains a local development tool for this phase.

### Risks
- Nearby natural-resource targeting may accidentally include player-built structures if block filtering is too naive.
- Pathfinding and collectblock behavior can fail in uneven terrain or obstructed areas.
- Refactor risk: preserving current behavior while splitting files may break existing commands if not regression-tested.
- Chest deposit can introduce additional complexity and may be better deferred if it destabilizes the run.

### Open questions
- Should `deposit` be included in this run or deferred to the next run if chest routing becomes noisy?
- Should stone gathering target only exposed surface stone/cobblestone, or any reachable stone within a limited search radius?

## 13. Final notes for Codex
Use this section for direct implementation instructions.

Preserve the current working bot behavior first, then extend it.

Prefer this order:
1. establish target file layout and contracts
2. move existing commands into modules without changing behavior
3. add `status`
4. add `goto <x> <y> <z>`
5. add `stone [count]`
6. add `drop all`
7. add `deposit` only if it stays clean and localized

Keep changes localized and explicit.
Do not add unconstrained agent logic.
Do not let the LLM plan actions in this run.
Prefer helper functions and capability modules over large rewrites inside one file.
If a feature becomes unstable, reduce scope rather than broadening the run.
