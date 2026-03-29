# Pixelmon Pal Phase 3 - Crafting Foundation

## 1. Objective
Describe the feature or change in plain language.

### Summary
Add a crafting foundation to the Minecraft worker bot so it can convert gathered wood into useful crafted items and use those crafted items in later workflows.

### Business / user goal
The bot currently gathers and deposits raw wood, but most future survival capabilities depend on crafting. Crafting is the dependency layer for tools, storage, workstation setup, and later building workflows.

### Definition of success
The bot can reliably craft planks and sticks from gathered logs, can craft and place a crafting table when needed, can craft a chest when needed, and can report clear status and failure messages while preserving the existing wood gather and deposit workflow.

## 2. Current state
Describe the current system behavior and relevant baseline.

### Existing behavior
The bot can join the local Minecraft world, respond in chat through LM Studio, gather nearby wood, remember home and chest locations, return to a known location, and deposit gathered wood into a configured chest.

### Relevant files / components
- capability registry
- task manager / task lock system
- chat router / command parser
- wood gathering capability
- home memory capability / state
- chest memory capability / state
- deposit to chest capability
- bot adapter / Mineflayer integration layer

### Existing constraints
The bot runs locally with Node.js, Mineflayer, and LM Studio. The current world target is a local Prism LAN setup on a supported Mineflayer version. Existing working commands and capability structure must be preserved. This run should extend the worker bot, not redesign it.

## 3. Requested change
Describe exactly what needs to change.

### New behavior
Add crafting capabilities that allow the bot to:
- craft oak or mixed wood logs into planks
- craft planks into sticks
- craft and place a crafting table when a recipe requires one and none is available nearby
- craft and place a chest when requested or when a downstream workflow explicitly needs storage and no chest is configured
- report what it crafted and where it placed required infrastructure

Crafting must integrate with the current capability system rather than being implemented as ad hoc logic inside chat handlers.

### User-facing commands / inputs
- `craft planks`
- `craft planks <count>`
- `craft sticks`
- `craft sticks <count>`
- `craft crafting table`
- `craft chest`
- `place crafting table`
- `place chest`
- `craft status`

Optional aliases are allowed only if they remain simple and deterministic.

### Expected outputs
- chat confirmation when crafting starts
- chat confirmation when crafting completes
- chat failure message when ingredients are missing, inventory is full, no placement location is available, or a required recipe/workstation cannot be satisfied
- internal state updates when a crafting table or chest is placed intentionally by the bot

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- add crafting-related capabilities
- support crafting planks and sticks from available logs/planks
- support crafting and placing a crafting table
- support crafting and placing a chest
- preserve and integrate with existing home/chest memory logic
- add tests and manual verification for crafting flows

### Out of scope
- tool crafting beyond what is strictly required for crafting infrastructure
- furnace crafting or smelting
- automatic mining for non-wood inputs
- full natural-language intent routing such as "go get some wood for us"
- blueprint house construction
- autonomous base planning or house design

### Future scope
- wooden and stone tool crafting
- gather-and-craft composite workflows
- chest auto-provisioning inside higher-level resource loops
- blueprint-based structure building

## 5. Functional requirements
List the required behaviors.

### Requirement 1
The bot must be able to convert logs in inventory into planks using valid Mineflayer recipe discovery rather than hard-coded assumptions.

### Requirement 2
The bot must be able to convert planks into sticks using valid recipe discovery and must correctly calculate ingredient sufficiency before attempting the craft.

### Requirement 3
The bot must be able to craft a crafting table and place it nearby when needed for workstation-based recipes and when safe placement space exists.

### Requirement 4
The bot must be able to craft a chest, place it when requested, and update chest memory only when chest placement is intentional and successful.

### Requirement 5
The bot must expose crafting through the existing command/capability system and respect the current task lock or active-task protections so two capabilities do not run at once.

### Requirement 6
The bot must provide a status command or equivalent response that tells the user whether it is idle, crafting, missing ingredients, or blocked by environment constraints.

## 6. Technical requirements
Document implementation expectations.

### Language / framework
Node.js with Mineflayer and the existing local LM Studio integration.

### Required libraries
- `mineflayer`
- `minecraft-data`
- existing project dependencies already used by the bot

### Required patterns to preserve
- existing capability registry pattern
- existing task manager / busy lock behavior
- existing chat routing structure
- existing home/chest memory handling
- existing bot startup/config flow
- existing concise user-facing chat responses

### Forbidden changes
- do not rewrite the whole project around a new framework
- do not remove or break existing wood gather/deposit behavior
- do not replace deterministic capabilities with freeform LLM control
- do not add broad autonomous planning in this run
- do not change unrelated capabilities unless required for compatibility

## 7. Data and contracts
Define any important interfaces.

### Inputs
Chat commands and capability invocations for crafting-related actions. Commands may include an optional integer count where appropriate.

### Outputs
- crafted items added to inventory
- placed crafting table or chest blocks in the world
- memory updates for intentionally placed chest location when applicable
- chat responses describing success, missing ingredients, or blocked states

### Internal contracts
New crafting capabilities must conform to the existing capability module shape and execution contract used by the project. Any memory updates must happen through the existing state or memory abstraction, not by writing ad hoc globals. Placement helpers must return clear success/failure values so higher-level capabilities can act on them.

## 8. Error handling
Describe how failure must work.

### Failure cases
- missing required ingredients
- no valid recipe available for the current version/inventory
- no nearby valid placement spot for crafting table or chest
- inventory full or blocked crafting flow
- active task already running

### Required failure behavior
The bot must not silently fail. It must report why the craft could not complete, log the underlying error for debugging, and exit the capability cleanly without corrupting memory state.

### Recovery rules
After a failed crafting attempt, the bot must return to idle state unless another explicit recovery path already exists. Failed placement must not overwrite remembered chest or home locations. Partial success should be reported accurately, for example crafting a table but failing to place it.

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1
**Given:** the bot has logs in inventory and is idle  
**When:** the user issues `craft planks 16`  
**Then:** the bot crafts the requested planks if enough logs are available and reports completion in chat.

### Scenario 2
**Given:** the bot has planks but no sticks and is idle  
**When:** the user issues `craft sticks 8`  
**Then:** the bot crafts the requested sticks if enough planks are available and reports completion in chat.

### Scenario 3
**Given:** the bot has enough planks for a crafting table and no nearby placed crafting table  
**When:** the user issues `place crafting table`  
**Then:** the bot crafts a crafting table if needed, places it in a valid nearby location, and reports where it was placed or that placement failed.

### Scenario 4
**Given:** the bot has enough planks for a chest and the user wants storage prepared  
**When:** the user issues `craft chest` or `place chest`  
**Then:** the bot crafts the chest, places it if requested and possible, and updates chest memory only after successful intentional placement.

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- verify `craft planks` works from gathered logs
- verify `craft sticks` works from available planks
- verify `place crafting table` creates and places the table when no table is nearby
- verify `place chest` creates and places a chest and does not corrupt existing chest memory on failure
- verify existing wood gather and deposit commands still work after crafting changes

### Automated verification
- unit test for ingredient counting / recipe requirement helpers
- unit test for memory update rules around intentional chest placement
- integration test or simulated capability test for crafting command routing
- smoke test that existing resource loop commands still load and execute

### Regression requirements
Existing commands for chat reply, wood gathering, home/chest memory, return behavior, and deposit behavior must continue working exactly as before unless a spec-defined extension is required.

## 11. Technomancy execution contract

### Run classification
medium

### Agent structure
- Arch Technomancer: 1
- High Technomancer: 1
- Technomancers per High: 2

### Parallelism rules
Capability implementation and helper extraction may run in parallel only after the contracts for crafting, placement, and memory updates are frozen. Chat routing updates, integration wiring, and final regression verification must remain sequential.

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

## 12. Risks and assumptions

### Assumptions
- the current home/chest memory and task lock systems are functioning and reusable
- Mineflayer recipe discovery for the target version is sufficient for planks, sticks, crafting table, and chest recipes
- the bot is operating in an environment where nearby block placement is allowed

### Risks
- recipe handling may vary slightly across versions or item variants
- placement logic can fail in cramped terrain or around protected blocks
- chest memory can become incorrect if placement success is not validated carefully

### Open questions
- should `craft chest` only craft into inventory, or also place automatically when no chest is configured
- should the bot prefer an existing nearby crafting table before crafting a new one in every case

## 13. Final notes for Codex
Use this section for direct implementation instructions.

Preserve the existing capability structure and current working commands. Prefer helper functions over large rewrites. Keep Mineflayer crafting and placement logic localized to dedicated capability and utility modules. Do not add broad autonomous behavior. Build the minimum stable crafting foundation needed for future survival loops and later building workflows.
