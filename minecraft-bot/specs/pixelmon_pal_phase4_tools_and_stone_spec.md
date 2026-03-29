# Pixelmon Pal Phase 4 - Tool Progression and Stone Resource Loop

## 1. Objective
Add the next survival-worker milestone to the Minecraft bot so it can craft and equip basic tools, gather cobblestone, upgrade itself to stone tools, and integrate those behaviors into the existing home/chest workflow.

### Summary
Build a complete progression loop that starts from the current wood-capable worker bot and extends it into a basic survival laborer. The bot must be able to craft required wooden tools, equip the correct tool when needed, gather cobblestone, return home, deposit resources, and then craft upgraded stone tools when materials are available.

### Business / user goal
The bot is no longer just a wood runner. This milestone should make it materially more useful by giving it the ability to improve its own efficiency and unlock the next layer of Minecraft survival automation.

### Definition of success
This run is successful when the bot can:
- craft and equip wooden axe / wooden pickaxe as needed
- gather cobblestone through a stable command or workflow
- return home and deposit gathered stone into the configured chest flow
- craft stone axe / stone pickaxe when enough materials exist
- prefer better available tools automatically instead of staying stuck on wooden tools
- preserve all existing working wood, chest, and crafting behavior

## 2. Current state
The bot is now modularized and has working support for home/chest memory, wood gathering/deposit loops, and crafting infrastructure.

### Existing behavior
Today the bot can:
- join the local Minecraft world
- respond to chat commands
- use LM Studio for limited chat replies
- gather nearby wood
- remember home / chest context
- return and deposit wood into a chest
- craft basic resource-processing items such as planks, sticks, crafting table, and chest

The bot does not yet have a proper tool progression loop. It should not remain a bare-hands or single-purpose worker.

### Relevant files / components
- `src/index.js`
- `src/core/capabilityRegistry.js`
- `src/core/taskManager.js`
- `src/core/chatRouter.js`
- `src/core/state.js`
- `src/capabilities/gatherWood.js`
- `src/capabilities/depositToChest.js`
- `src/capabilities/craftPlanks.js`
- `src/capabilities/craftSticks.js`
- `src/capabilities/craftCraftingTable.js`
- `src/capabilities/craftChest.js`
- `src/utils/inventory.js`
- `src/utils/movement.js`
- `src/utils/blocks.js`

### Existing constraints
- Runtime remains Node.js with Mineflayer-based control.
- World is local Prism-based vanilla 1.21.11 LAN testing unless project config says otherwise.
- Existing home/chest memory behavior must remain intact.
- Existing command routing and task locking patterns must be preserved.
- This milestone should remain deterministic and capability-driven, not open-ended LLM autonomy.
- New capabilities must fit the current modular structure rather than being re-inlined into one giant file.

## 3. Requested change
Add a full tool and stone progression layer on top of the existing worker foundation.

### New behavior
After this change, the bot should be able to:
- determine whether it has a usable axe or pickaxe for the requested task
- craft wooden tools when required prerequisites are available
- equip the most appropriate available tool for chopping or mining
- gather cobblestone from reachable nearby stone blocks
- return home and deposit cobblestone into the configured chest workflow
- craft stone tools when enough cobblestone and sticks exist
- prefer stone tools over wooden tools when both are available
- report clear status and failure reasons through chat

### User-facing commands / inputs
At minimum, add or support commands equivalent to:
- `craft wooden axe`
- `craft wooden pickaxe`
- `craft stone axe`
- `craft stone pickaxe`
- `equip axe`
- `equip pickaxe`
- `cobble`
- `cobble <count>`
- `stone tools`
- `status`
- `inventory`

If the project already uses a command namespace or capability mapping pattern, preserve that pattern. Command naming may be adjusted slightly to match the established router, but the milestone must expose equivalent functionality.

### Expected outputs
The system should:
- craft the requested tools when materials are available
- equip tools and confirm that in chat
- gather the requested cobblestone amount or a best-effort nearby amount
- return home and deposit stone when the workflow requires it
- send completion / partial completion / failure messages in chat
- update task state cleanly
- leave inventory, home memory, and chest memory in a valid state

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- Wooden axe crafting
- Wooden pickaxe crafting
- Stone axe crafting
- Stone pickaxe crafting
- Tool selection / equipping helpers
- Cobblestone gathering capability
- Cobblestone deposit loop using the existing home/chest pattern
- Preference rules for choosing the best available axe/pickaxe
- Capability registry and task-manager integration for the above
- Manual and automated verification for tool progression and stone loop behavior

### Out of scope
- Iron, gold, diamond, or netherite progression
- Furnace / smelting systems
- Combat and mob handling
- Deep cave exploration
- Freeform building or house generation
- LLM freeform intent parsing for vague phrases
- Full autonomous survival gameplay
- Broad resource loops beyond stone and the already-completed wood flow

### Future scope
- Iron tool progression
- Furnace and smelting workflows
- Tool durability monitoring and automatic replacement
- Multi-resource plans such as "stock the chest with wood and stone"
- Natural-language intent mapping onto completed capabilities
- Blueprint-based building workflows

## 5. Functional requirements
List the required behaviors.

### Requirement 1
The bot must be able to craft a wooden axe and wooden pickaxe when required materials are available and a crafting path exists through current crafting helpers.

### Requirement 2
The bot must be able to equip an appropriate axe for wood-related tasks and an appropriate pickaxe for stone-related tasks, using the best available tier among supported tools.

### Requirement 3
The bot must be able to gather reachable nearby cobblestone or mine stone to obtain cobblestone, based on the actual block behavior and current world conditions.

### Requirement 4
The bot must be able to return to the configured home/chest area and deposit gathered cobblestone using the existing chest workflow without breaking current wood deposit behavior.

### Requirement 5
The bot must be able to craft stone axe and stone pickaxe when required cobblestone and sticks are available.

### Requirement 6
The bot must automatically prefer stone tools over wooden tools for supported actions whenever a usable stone tool is present.

### Requirement 7
The bot must surface meaningful progress or failure messages such as missing materials, no reachable stone nearby, no configured chest, inventory full, or unable to craft due to missing crafting table access.

### Requirement 8
The bot must preserve existing working commands and flows for chat, LM Studio reply handling, home memory, chest memory, wood gathering, and prior crafting features.

## 6. Technical requirements
Document implementation expectations.

### Language / framework
Node.js with Mineflayer and the current modular bot structure.

### Required libraries
- `mineflayer`
- `mineflayer-pathfinder`
- `minecraft-data`
- existing project crafting and capability dependencies already in use

New dependencies are allowed only if they solve a concrete problem cleanly and fit the current architecture. Do not add a large new framework for this milestone.

### Required patterns to preserve
- Existing capability module pattern
- Existing capability registry / task manager flow
- Existing home/chest memory pattern
- Existing chat router conventions
- Existing status / busy / stop behavior where already implemented
- Existing logging and verification artifact conventions used by Technomancy

### Forbidden changes
- Do not collapse the modular structure back into one giant script.
- Do not rewrite unrelated wood or chest flows unless required for compatibility.
- Do not introduce broad autonomous LLM planning.
- Do not add Pixelmon logic in this run.
- Do not silently change working command semantics outside the scoped tool/stone features.
- Do not remove currently working commands.

## 7. Data and contracts
Define any important interfaces.

### Inputs
Expected inputs include:
- chat commands for tool crafting, equipping, cobblestone gathering, and stone upgrade flows
- current inventory state
- current equipped item state
- configured home/chest memory
- nearby reachable block queries
- crafting-table availability or crafting fallback logic

### Outputs
Expected outputs include:
- chat confirmations and failure messages
- inventory changes from crafted tools and gathered blocks
- equipped tool changes
- deposited cobblestone in the configured chest
- updated task state / lock state
- logs or verification notes consistent with project conventions

### Internal contracts
Important internal contracts should include:
- capability modules remain discrete and registry-driven
- a tool-selection helper should expose deterministic behavior for choosing preferred supported tools
- crafting helpers should return clear success/failure results rather than freeform side effects
- gather-cobblestone workflows must compose with existing home / deposit capabilities instead of duplicating that logic
- stone-tool upgrade logic must not bypass inventory/crafting contracts already established in earlier milestones

## 8. Error handling
Describe how failure must work.

### Failure cases
- Missing sticks, planks, or cobblestone for requested tool crafting
- No reachable stone / cobblestone nearby
- No configured home or chest for deposit workflow
- Inventory full
- Crafting table missing or inaccessible when needed
- Unable to equip requested tool
- Pathing or collection failure during stone gathering
- Task conflict because another action is already running

### Required failure behavior
The bot must:
- fail clearly in chat with a short actionable reason
- avoid corrupting task state or leaving the task lock stuck
- preserve existing home/chest memory even after failure
- stop the current capability cleanly when unrecoverable conditions occur
- log enough detail for debugging without flooding chat

### Recovery rules
- After failure, the bot should return to an idle-ready state unless a partial recovery step is explicitly safe.
- Temporary failures should not delete memory or unregister capabilities.
- If a gather loop only partially succeeds, the bot should report partial completion accurately.
- If better tools cannot be crafted, the bot may continue with a lower-tier supported tool only when that is safe and consistent with the command.

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1
**Given:** the bot has logs, planks/sticks can be produced, and no axe is equipped  
**When:** the user issues a command to craft a wooden axe  
**Then:** the bot crafts the wooden axe, updates inventory, and can equip it successfully.

### Scenario 2
**Given:** the bot has a configured home/chest location and reachable nearby stone  
**When:** the user issues `cobble 32`  
**Then:** the bot gathers cobblestone up to the reachable requested amount, returns home, deposits it into the chest, and reports completion or partial completion.

### Scenario 3
**Given:** the bot has sticks and enough cobblestone in inventory or accessible workflow state  
**When:** the user issues a stone-tool upgrade command  
**Then:** the bot crafts a stone pickaxe and/or stone axe as required and prefers those tools over wooden equivalents for subsequent supported actions.

### Scenario 4
**Given:** the user requests cobblestone gathering but no reachable stone exists nearby  
**When:** the bot evaluates the request  
**Then:** it does not hang, reports the missing reachable stone condition clearly, and returns to an idle-ready state.

### Scenario 5
**Given:** existing wood workflow was working before this run  
**When:** the updated bot is tested with prior wood commands  
**Then:** wood gathering, returning home, depositing, and crafting-related existing commands still work.

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- Verify wooden axe and pickaxe crafting from a valid starting inventory.
- Verify stone axe and pickaxe crafting after collecting cobblestone.
- Verify `equip axe` and `equip pickaxe` use the best available supported tool.
- Verify `cobble` and `cobble <count>` gather reachable stone and report progress correctly.
- Verify cobblestone is deposited into the configured chest using the existing return-home flow.
- Verify prior wood/chest/crafting commands still work.

### Automated verification
- Unit test for tool-preference selection logic
- Unit test for crafting prerequisite checks
- Unit test for command-to-capability routing for new commands
- Integration test for gather-cobble workflow using mocked capability boundaries where practical
- Smoke test that existing bot startup and command registration still succeed

### Regression requirements
The implementation must not break:
- bot startup and login
- LM Studio chat reply path
- home/chest memory
- wood gathering and deposit loop
- previously completed crafting features
- existing stop/status/inventory behavior already present in the project

## 11. Technomancy execution contract

### Run classification
large

### Agent structure
- Arch Technomancer: 1
- High Technomancer: 2
- Technomancers per High: 2-3

### Parallelism rules
Sequential dependencies:
- tool selection / crafting contracts should be defined before downstream capabilities depend on them
- stone upgrade workflow should not finalize until cobblestone gathering and crafting helpers are stable

Parallelizable work:
- wooden and stone crafting capability modules may be developed in parallel once shared contracts are fixed
- command routing and verification artifact work may proceed in parallel with capability implementation
- regression verification can run alongside final stabilization after feature integration

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
- manual verification confirms tool crafting, equipping, cobblestone loop, and stone upgrade behavior
- regression checks confirm earlier wood/chest/crafting flows still work

## 12. Risks and assumptions

### Assumptions
- The current modular bot structure is already in place and working.
- Home/chest memory and deposit behavior are stable enough to build on.
- The local test world contains reachable trees and reachable stone for manual verification.
- Existing crafting abstractions can be extended instead of replaced.

### Risks
- Stone gathering may fail in awkward terrain or unreachable areas even when stone is nearby.
- Crafting logic may become duplicated if shared helper contracts are not established first.
- Tool-equipping behavior may conflict with current task execution if state transitions are sloppy.
- A broad combined milestone increases regression risk if verification is weak.

### Open questions
- Should `cobble` mine raw stone blocks for cobblestone only, or also target existing cobblestone blocks if nearby?
- Should stone-tool upgrade craft both axe and pickaxe automatically, or only craft missing/needed tools?
- Should the bot proactively replace broken/missing tools during gather loops, or only when explicitly commanded in this milestone?

## 13. Final notes for Codex
Use this section for direct implementation instructions.

- Prefer helper-driven implementations over large rewrites.
- Keep changes localized to the current modular architecture.
- Reuse existing return-home and deposit capabilities instead of cloning their logic.
- Establish a single shared helper for supported tool preference rules.
- Keep chat feedback short, deterministic, and useful.
- Preserve current working commands unless explicitly superseded by the new scoped commands.
- Do not add LLM intent parsing for vague requests in this run.
- Do not expand into house building, combat, furnace logic, or Pixelmon work during this milestone.
