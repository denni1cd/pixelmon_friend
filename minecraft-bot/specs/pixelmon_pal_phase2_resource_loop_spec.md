# Pixelmon Pal Phase 2 - Wood Resource Loop and Dropoff Memory

## 1. Objective
Describe the feature or change in plain language.

### Summary
Extend the current Minecraft worker bot so it can complete a full wood resource loop instead of only gathering nearby wood into its own inventory. The bot must be able to remember a home location, remember a chest or chest area for dropoff, gather wood, return, and deposit the gathered wood. This run should preserve the current modular capability structure created in Phase 1 and avoid prematurely adding freeform natural-language planning.

### Business / user goal
The bot currently proves that local chat, movement, and basic gathering work, but it still behaves like a narrow command demo. The user goal for this update is to make the bot useful as a simple worker: it should be able to fetch wood for the group and put it away instead of stopping halfway with inventory full of logs.

### Definition of success
This update is successful when:
- the bot still connects successfully to the local Prism-hosted vanilla 1.21.11 LAN world
- the current working command set still functions
- the bot can save and reuse a home location
- the bot can save and reuse a chest or chest dropoff target
- the bot can gather a requested amount of wood, return, and deposit the wood into the designated chest
- failure states are reported clearly and the bot returns to a stable idle state after failure
- natural-language freeform LLM task selection is still not driving worker execution in this run

## 2. Current state
Describe the current system behavior and relevant baseline.

### Existing behavior
The bot currently:
- runs locally through Node.js and Mineflayer
- connects to a Prism-hosted vanilla 1.21.11 LAN world
- uses LM Studio locally for short chat replies through `bot, <message>`
- supports explicit worker commands such as movement, inventory/status, and wood gathering
- can gather nearby wood into inventory
- can drop wood or other carried materials when explicitly told
- has a modular capability-based structure from the previous refactor

The current gap is that the bot does not complete a useful resource loop. It has no persistent notion of home, no remembered chest target, and no worker command that means "gather wood for us and put it away." Natural-language understanding is also intentionally limited to chat reply behavior and explicit command parsing.

### Relevant files / components
- `src/index.js` or current runtime entrypoint
- `src/core/capabilityRegistry.js`
- `src/core/taskManager.js`
- `src/core/chatRouter.js`
- `src/core/state.js` or equivalent runtime state module
- `src/capabilities/gatherWood.js`
- `src/capabilities/inventorySummary.js`
- `src/capabilities/dropWood.js` or equivalent material drop capability
- `package.json`

### Existing constraints
- Runtime is local only for this phase.
- Minecraft test target remains vanilla `1.21.11` via Prism LAN.
- Bot connection remains `auth: 'offline'` for local testing.
- LM Studio remains local and reachable at `http://127.0.0.1:1234/v1`.
- Current model remains `qwen_qwen3-30b-a3b-instruct-2507` unless already externalized in config.
- Existing Mineflayer-based worker commands must continue to work.
- This run should not expand into Pixelmon behavior.
- This run should not introduce unconstrained LLM planning.

## 3. Requested change
Describe exactly what needs to change.

### New behavior
Add a complete wood resource loop on top of the current capability framework. The bot must be able to:
- save a home location
- save a chest target or chest dropoff anchor
- return to home when asked
- deposit carried wood into the remembered chest
- execute a single command that gathers a requested amount of wood and deposits it at the chest before reporting completion

This run must prefer explicit, deterministic worker workflows over freeform model decisions.

### User-facing commands / inputs
Preserve all current working commands.

Add these commands in this run:
- `set home`
- `set chest`
- `go home`
- `deposit wood`
- `deposit all` if generalized deposit is already compatible with the current design
- `wood run`
- `wood run <n>`
- `where is home`
- `where is chest`

If command naming must differ slightly to fit the current chat router, preserve the intent exactly and document the final names.

### Expected outputs
The bot must:
- confirm when home is saved
- confirm when chest is saved
- report remembered home and chest data when asked
- gather wood into inventory when running a wood loop
- return to the remembered chest target
- deposit the requested gathered wood into the chest
- send concise status/failure/success messages in Minecraft chat
- keep the active task model stable so overlapping worker actions do not corrupt state

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- Persistent in-memory runtime storage for home and chest targets.
- Commands for saving and querying home/chest targets.
- A return-home capability.
- A deposit-to-chest capability.
- A composed wood resource loop capability that gathers and deposits wood.
- Clear status and failure reporting for the loop.
- Small helper changes needed to support chest interaction and resource-loop composition.

### Out of scope
- Freeform LLM intent mapping for commands like "go get some wood for us".
- General autonomous planning.
- Multi-step planner prompts where the model chooses worker capabilities.
- Crafting, smelting, farming, or blueprint building.
- Multiple chest routing strategies or logistics optimization.
- Pixelmon or mod-specific behavior.
- Persisting state to disk unless already trivial within the current framework.

### Future scope
- Natural-language intent mapping that translates fuzzy requests into explicit worker capabilities.
- Generalized gather-and-deposit loops for stone, crops, and other resources.
- Persisting home/chest memory across restarts.

## 5. Functional requirements
List the required behaviors.

### Requirement 1
The bot must allow the player to save a home location based on the bot's current position or another clearly documented reference point, and that saved home location must be used by `go home`.

### Requirement 2
The bot must allow the player to save a chest target that is later used for wood deposit. The saved chest target must be reachable by the bot using the existing movement/pathfinding framework.

### Requirement 3
The bot must support a deposit workflow that opens the remembered chest and transfers wood from inventory into it, with clear failure reporting if the chest is missing, blocked, or unreachable.

### Requirement 4
The bot must support a composed worker command such as `wood run <n>` that gathers wood, returns to the remembered chest/home area as appropriate, deposits the wood, and reports completion or failure.

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
- Preserve the current modular capability structure from Phase 1.
- Preserve the current chat router and task-manager architecture unless small targeted changes are required.
- Preserve the single active task rule.
- Preserve local Prism/LAN testing on vanilla `1.21.11`.
- Preserve LM Studio chat reply behavior through `bot, <message>` without making it the worker planner.
- Prefer composition of existing capabilities over large rewrites.

### Forbidden changes
- Do not re-collapse the project back into one monolithic runtime file.
- Do not replace explicit worker commands with freeform LLM decision-making.
- Do not add Pixelmon logic.
- Do not add unrelated resource types or broad new systems just because chest logic is being added.
- Do not break current working commands while adding the resource loop.
- Do not introduce a new framework or move away from Mineflayer.

## 7. Data and contracts
Define any important interfaces.

### Inputs
Minecraft chat commands issued by the player.

Expected new command shapes:
- `set home`
- `set chest`
- `go home`
- `where is home`
- `where is chest`
- `deposit wood`
- `deposit all` if implemented
- `wood run`
- `wood run <count>`

If `wood run` has a default count, document the default explicitly.

### Outputs
- Minecraft chat confirmation for state-setting commands
- Minecraft chat status updates during the wood loop
- inventory side effects from gathering and depositing wood
- chest inventory side effects when deposit succeeds
- normalized task/capability result objects for internal composition
- Technomancy run artifacts under the required docs path

### Internal contracts
Use the existing capability contract from Phase 1. Each new capability module should expose a stable shape such as:

```js
module.exports = {
  name: 'deposit_wood',
  aliases: ['deposit wood'],
  description: 'Deposit carried wood into the remembered chest.',
  async execute(context, args) {
    // returns normalized result
  }
}
```

Recommended internal state contract:

```js
{
  homePosition: { x, y, z, dimension },
  chestPosition: { x, y, z, dimension }
}
```

Recommended normalized result shape:

```js
{
  ok: true,
  message: 'Deposited 32 logs into the chest.',
  data: { deposited: 32 }
}
```

Task composition rules:
- composed capabilities such as `wood_run` must call lower-level capabilities through the task/capability framework, not duplicate their logic inline
- active task state must transition cleanly from idle -> running -> complete/failed -> idle
- a failed deposit must not leave the bot permanently locked in a running state

## 8. Error handling
Describe how failure must work.

### Failure cases
- Home has not been set when `go home` is requested.
- Chest has not been set when deposit is requested.
- Saved chest block is gone, changed, or no longer reachable.
- Inventory is full during gathering.
- No reachable wood is found nearby.
- Pathfinding fails or the bot becomes stuck.
- Chest opens but deposit fails for a slot or container reason.
- The user provides malformed command arguments.

### Required failure behavior
- Log the underlying error to the console.
- Send a short human-readable failure message in Minecraft chat.
- Release active task state after failure.
- Do not silently swallow chest or pathing errors.
- Provide usage hints for malformed commands.

### Recovery rules
- After a failure, the bot must return to a stable idle state.
- Home/chest memory should remain intact unless explicitly reset by the user or invalidated by a deliberate design choice documented in code.
- A failed `wood run` must not partially register success if deposit never happened.

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1
**Given:** the bot is connected and standing near the intended base area  
**When:** the user says `set home`  
**Then:** the bot saves the home position and confirms it in chat

### Scenario 2
**Given:** the bot is standing near the intended chest and the chest is reachable  
**When:** the user says `set chest`  
**Then:** the bot saves the chest target and confirms it in chat

### Scenario 3
**Given:** home and chest are already set, and reachable wood exists nearby  
**When:** the user says `wood run 32`  
**Then:** the bot gathers wood, returns to the remembered dropoff area, deposits the gathered wood into the remembered chest, and reports completion in chat

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- Verify that `set home` and `where is home` work and report consistent coordinates.
- Verify that `set chest` and `where is chest` work and reference the intended chest.
- Verify that `deposit wood` transfers carried wood into the saved chest.
- Verify that `wood run 16` gathers wood and deposits it without manual intervention.
- Verify that existing commands such as `follow me`, `come here`, `inventory`, and `wood <n>` still work.

### Automated verification
- Unit test command parsing for the new home/chest/deposit/wood-run commands.
- Unit test capability result normalization for save-home, save-chest, and deposit capabilities.
- Integration test task-manager state transitions for a composed `wood_run` workflow.
- Smoke test startup and registry loading so the bot still boots with the new capability modules.

### Regression requirements
Existing working behaviors from Phase 1 must still function, including:
- LM Studio chat reply through `bot, <message>`
- movement/follow/stop commands
- inventory/status reporting
- direct wood gathering commands
- local join flow on Prism LAN using vanilla `1.21.11`

## 11. Technomancy execution contract

### Run classification
medium

### Agent structure
- Arch Technomancer: 1
- High Technomancer: 1
- Technomancers per High: 2-3

### Parallelism rules
The run should stay mostly sequential at the milestone level:
- first extend state/contracts for home and chest memory
- then implement deposit capability and helper utilities
- then implement the composed wood loop
- then perform verification and regression checks

Limited parallelism is allowed only where safe:
- one Technomancer may work on command/router wiring while another works on chest/deposit helpers
- verification documentation may begin once interfaces stabilize

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
- the bot successfully completes at least one full manual `wood run` from gather to chest deposit in the local Prism LAN test world

## 12. Risks and assumptions

### Assumptions
- The current modular capability structure from Phase 1 exists and is stable enough to extend.
- The chest to be remembered is a normal reachable chest block in the same dimension as the bot.
- The local Prism-hosted vanilla 1.21.11 world remains the development target.

### Risks
- Chest interaction can be more brittle than raw block gathering and may fail if the chest target is blocked or mismatched.
- Saving chest/home by position alone may be fragile if the world layout changes.
- A composed workflow may expose task-manager edge cases that were not visible with single-step capabilities.

### Open questions
- Should `set chest` save the block the bot is looking at, the nearest chest, or the chest the bot is standing next to?
- Should `wood run <n>` return home first before depositing, or deposit directly to the remembered chest regardless of home?
- Should only logs be deposited, or should saplings/sticks from the run also be deposited in this phase?

## 13. Final notes for Codex
Use this section for direct implementation instructions.

Preserve the current project structure and extend it locally.
Prefer helper functions and capability composition over large rewrites.
Keep changes localized to the runtime, state, router, and new capability modules required for the resource loop.
Do not add new dependencies unless Mineflayer already requires them or they are clearly necessary.
Do not add freeform LLM tool selection in this run.
Make the worker loop actually useful before making the bot sound smarter.
