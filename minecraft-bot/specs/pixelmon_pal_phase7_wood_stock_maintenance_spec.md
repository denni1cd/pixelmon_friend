# Pixelmon Pal Phase 7 - Wood Stock Maintenance and Chest Refill Automation

## 1. Objective
Add a deterministic stock-maintenance workflow so the bot can inspect chest wood levels, decide when stock is low, gather replacement wood, return home, and deposit it without requiring the player to issue each sub-command manually.

### Summary
Build a bounded maintenance system centered on wood stock. The bot should be able to inspect a configured home chest, compare current wood inventory against a configured or default minimum threshold, and automatically run the existing gather / return / deposit workflow when the stock is below target. This should be deterministic runtime logic, not freeform LLM reasoning.

### Business / user goal
The bot is currently capable of gathering wood and depositing it into the chest, but only when the player manually issues each command. That makes it feel procedural instead of helpful. The goal of this run is to make the bot behave more like a useful worker by recognizing when wood is low and replenishing it through a single bounded workflow.

### Definition of success
This run is successful when:
- the bot can inspect the configured home chest and determine how much wood is currently stored
- the bot can compare chest wood count against a target minimum threshold
- when stock is low, the bot can gather enough wood to close all or part of the deficit, return home, and deposit it
- equipped gear and reserved tool items are not dumped into the chest by stock-maintenance deposit logic
- the workflow can be triggered manually by a single command and can optionally run as an enabled maintenance mode
- the bot clearly reports whether the chest is already stocked, currently being restocked, or unable to restock
- the workflow respects existing task locks, cancellation rules, and hardening patterns from the previous milestone

## 2. Current state
Describe the current system behavior and relevant baseline.

### Existing behavior
Today the bot can:
- join the local supported Minecraft test world and respond to chat
- use bounded natural-language routing and exact commands
- remember home, chest, and related worker state
- gather wood, return home, and deposit wood into the chest
- craft planks, sticks, crafting table, and chest
- craft and equip wooden / stone tools and avoid dumping equipment when deposit-all behavior is used
- run modular capabilities through the current capability registry and task manager

What is still missing is stock awareness. The bot does not yet inspect chest contents and decide whether additional wood is needed. The player still has to drive the sequence manually.

### Relevant files / components
- `src/index.js`
- `src/core/chatRouter.js`
- `src/core/capabilityRegistry.js`
- `src/core/taskManager.js`
- `src/core/state.js`
- `src/core/logger.js`
- `src/core/llmClient.js`
- `src/capabilities/gatherWood.js`
- `src/capabilities/goHome.js`
- `src/capabilities/depositAll.js`
- `src/capabilities/depositToChest.js`
- `src/utils/storage.js`
- `src/utils/inventory.js`
- `src/utils/blocks.js`
- `src/utils/movement.js`

### Existing constraints
- Runtime remains Node.js with Mineflayer and the current modular architecture.
- The existing home/chest memory model must be preserved.
- Existing gather, return, deposit, crafting, and tool workflows must continue to work.
- Deposit behavior already excludes equipped or reserved equipment and that rule must remain intact.
- This run should extend the current architecture, not replace it.
- Automation must remain bounded and deterministic; this is not a freeform planning milestone.
- LLM use, if any, should only map user phrasing onto approved workflows and must not decide stock thresholds or chest policy on its own.

## 3. Requested change
Describe exactly what needs to change.

### New behavior
After this change, the bot should be able to:
- inspect the configured chest and count stored wood items
- determine whether wood stock is below a configured or default minimum threshold
- if stock is sufficient, report that no refill is needed
- if stock is low, calculate a refill target or deficit and execute the existing gather-wood, return-home, and deposit workflow automatically
- preserve equipment-safe deposit rules while depositing gathered wood
- expose a simple maintenance mode that can be manually invoked and optionally enabled/disabled for periodic checks
- provide clear status about current chest stock, target stock, refill progress, and failure reasons

### User-facing commands / inputs
This run should support a bounded command surface such as:
- `check wood stock`
- `maintain wood`
- `maintain wood 64`
- `enable wood maintenance`
- `disable wood maintenance`
- `wood stock status`
- approved natural-language equivalents only if they map onto the same validated workflow, for example:
  - `keep the wood chest stocked`
  - `make sure we don't run out of wood`
  - `top off the wood chest`

The exact command names may be adjusted to fit the existing router style, but the behavior should remain equivalent and deterministic.

### Expected outputs
The system should:
- report current chest wood count and target threshold when asked
- announce when restocking begins and how much wood it is trying to add
- announce successful completion, including final chest count if reasonably available
- announce when no refill is required because the chest is already stocked
- announce clear failure reasons such as missing chest memory, no reachable logs, inventory full, deposit failure, or already busy
- update internal state for maintenance mode, current task, last failure, and most recent stock-check result if such state is tracked

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- Chest inspection for wood-related stock counting
- A deterministic wood stock policy with a configurable or default threshold
- A `check stock` style command for wood
- A `maintain wood` workflow that chains chest inspection, gathering, return, and deposit
- An optional maintenance mode flag that periodically re-checks wood stock while idle
- Preservation of deposit-all exclusions for equipped or reserved gear
- Status reporting for stock checks and maintenance activity
- Task-manager-safe integration with the existing architecture
- Regression coverage for current wood gathering and deposit flows

### Out of scope
- General inventory balancing across many item types
- Farming, smelting, or non-wood stock maintenance
- Blueprint building, house construction, or structure placement
- Freeform autonomous prioritization across multiple resources
- Full economy logic such as multiple chests, sorting systems, or warehouse behavior
- New Pixelmon mechanics
- Voice input or external dashboard control
- Any rewrite of deposit logic that breaks equipment-safe behavior

### Future scope
- Additional stock maintenance policies for planks, sticks, cobblestone, or fuel
- Multi-resource maintenance scheduling and prioritization
- Better natural-language flexibility on top of the bounded maintenance workflow
- Clarifying questions when stock goals are ambiguous
- Integration with construction workflows that request resources proactively

## 5. Functional requirements
List the required behaviors.

### Requirement 1
The bot must be able to inspect the configured home chest and count wood stock using a clearly defined set of accepted wood item names or categories.

### Requirement 2
The bot must compare the observed chest wood count against a target minimum threshold and determine whether refill work is required.

### Requirement 3
The bot must expose a bounded workflow that, when triggered, will gather wood, return home, and deposit gathered wood into the configured chest until the threshold is met, the reachable supply is exhausted, or a safe failure condition occurs.

### Requirement 4
Deposit behavior used by this workflow must continue to exclude equipped tools, armor, and any other reserved equipment that current project rules already protect.

### Requirement 5
The bot must support a command or equivalent trigger for reporting current wood stock status, including current count, target threshold, and whether maintenance mode is enabled if that feature is implemented.

### Requirement 6
If maintenance mode is enabled, the bot must only attempt refill work when idle and must not interrupt an active task unless an explicit replacement rule already exists and is intentionally reused.

### Requirement 7
The bot must clearly refuse or defer stock maintenance when required memory is missing, such as no configured chest or no known home route where required by the workflow.

### Requirement 8
The bot must avoid infinite or noisy refill loops. It must have sensible cooldown, retry, or abort behavior after failure or unreachable resource conditions.

### Requirement 9
The bot must preserve existing manual commands for gathering wood, going home, and depositing items.

### Requirement 10
Natural-language support, if wired for this run, must remain bounded to approved maintenance actions and must normalize to deterministic internal action payloads before execution.

## 6. Technical requirements
Document implementation expectations.

### Language / framework
Node.js with Mineflayer and the current modular capability/task-manager architecture.

### Required libraries
- `mineflayer`
- `mineflayer-pathfinder`
- `mineflayer-collectblock`
- `minecraft-data`
- existing project state, storage, inventory, and logging utilities
- existing LM Studio integration only where needed for bounded action mapping

Do not add a new orchestration framework, scheduler framework, or persistence layer for this run unless strictly required.

### Required patterns to preserve
- Existing modular capability file layout
- Existing capability registry and task-manager mediation
- Existing remembered home/chest workflow model
- Existing deposit-all exclusions for equipment and reserved gear
- Existing hardening rules for busy-state handling, cancellation, and failure reporting
- Existing chat-router separation between exact commands and bounded natural-language parsing
- Existing local LM Studio + Prism/Mineflayer development flow

### Forbidden changes
- Do not let the LLM infer stock policies or manipulate raw Mineflayer calls directly.
- Do not broaden this run into multi-resource warehouse management.
- Do not remove or weaken the equipment-safe deposit exclusions.
- Do not bypass the task manager for chest inspection or refill work.
- Do not interrupt active tasks opportunistically unless an explicit, tested policy supports it.
- Do not silently change the semantics of existing wood commands beyond what is required for integration.

## 7. Data and contracts
Define any important interfaces.

### Inputs
Expected inputs include:
- player chat commands for stock checking and maintenance
- optional bounded natural-language requests that map to the same maintenance workflow
- remembered chest location and home state
- current chest contents as read through container access
- current inventory contents
- task-manager lifecycle state
- configurable threshold values or default maintenance targets

### Outputs
Expected outputs include:
- player-facing chat messages describing stock count, target threshold, refill start, completion, or failure
- validated internal execution requests such as a normalized maintenance action payload
- updated state for maintenance-mode enabled/disabled status and most recent stock result if tracked
- structured logs for chest inspection, threshold calculation, maintenance start, maintenance completion, and maintenance failure

### Internal contracts
Important internal contracts should include:
- a normalized stock-maintenance action payload, for example:
  ```json
  {
    "action": "maintain_wood_stock",
    "args": {
      "minimumChestWood": 64,
      "mode": "run_once"
    }
  }
  ```
- a chest-inspection helper that returns deterministic stock counts for the configured resource category
- a maintenance workflow that is task-manager-mediated and composes existing gather / return / deposit capabilities rather than duplicating them ad hoc
- deposit helpers must preserve protected equipment exclusions
- maintenance-mode state must be stored and read from a shared authoritative state location rather than ad hoc local variables
- failure, cooldown, and completion paths must update shared task state consistently

## 8. Error handling
Describe how failure must work.

### Failure cases
- no remembered chest is configured
- chest block missing, moved, or unreachable
- chest open/read failure
- no reachable wood nearby
- pathfinding failure during gather or return
- inventory full in a way that blocks progress
- deposit failure
- maintenance requested while already busy
- periodic maintenance fires while another task is active
- malformed natural-language action payload if LLM routing is included

### Required failure behavior
The bot must:
- fail safely without crashing the chat loop or wedging the task manager
- report concise player-facing error messages
- log enough detail to distinguish chest-inspection failure from gather failure from deposit failure
- avoid repeated immediate retries when the underlying condition is unlikely to change
- leave maintenance mode state and active task state internally consistent after failure

### Recovery rules
- If a one-shot maintenance run fails, the bot should return to idle and preserve a useful last-failure summary.
- If periodic maintenance mode is enabled and a check fails, the bot should enter a cooldown before rechecking.
- If the chest is missing or invalid, maintenance should remain disabled or inert until the chest is reset, rather than spamming attempts.
- If the bot cannot find enough wood, it should deposit whatever valid gathered wood it has if safe to do so, then report partial completion or failure clearly.

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1
**Given:** the bot knows its home chest and the chest already contains at least the configured minimum wood stock  
**When:** the player issues `maintain wood 64` or equivalent  
**Then:** the bot inspects the chest, reports that stock is already sufficient, and does not run a gather workflow

### Scenario 2
**Given:** the bot knows its home chest, the chest wood count is below the configured minimum, and reachable trees are available  
**When:** the player issues `maintain wood 64` or equivalent  
**Then:** the bot inspects stock, gathers wood, returns home, deposits gathered wood while preserving equipment exclusions, and reports completion or partial completion

### Scenario 3
**Given:** the bot has no remembered chest configured  
**When:** the player issues `check wood stock` or `maintain wood`  
**Then:** the bot refuses the workflow clearly, does not start gathering, and reports that chest memory must be set first

### Scenario 4
**Given:** maintenance mode is enabled and the bot is idle  
**When:** a scheduled recheck finds chest wood below the configured minimum  
**Then:** the bot begins the bounded wood-maintenance workflow automatically and reports that maintenance was triggered

### Scenario 5
**Given:** maintenance mode is enabled but the bot is already running a task  
**When:** a scheduled recheck occurs  
**Then:** the bot defers the maintenance run without interrupting the active task and remains internally consistent

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- Verify that `check wood stock` reports a sensible current count and threshold
- Verify that `maintain wood <n>` fills a chest that starts below threshold
- Verify that the bot does nothing except report status when chest stock is already sufficient
- Verify that equipment-safe deposit exclusions still hold during maintenance runs
- Verify that enabling and disabling maintenance mode changes periodic behavior predictably
- Verify that missing chest memory produces a clean refusal instead of a broken gather loop

### Automated verification
- Unit test chest stock counting helpers for accepted wood item names
- Unit test threshold comparison and deficit calculation
- Unit test maintenance payload validation and normalization
- Integration test the one-shot `maintain_wood_stock` workflow with mocked capability results
- Smoke test that existing gather wood and deposit commands still function after the new integration

### Regression requirements
The following existing behavior must still work after this run:
- manual wood gathering commands
- manual go-home and deposit workflows
- crafting flows and current equipment handling
- current task safety / hardening behavior
- existing bounded natural-language routing for already supported actions

## 11. Technomancy execution contract

### Run classification
medium

### Agent structure
- Arch Technomancer: 1
- High Technomancer: 1
- Technomancers per High: 2-3

### Parallelism rules
The run should remain mostly sequential at the feature level:
- stock policy and chest-inspection contracts should be defined first
- maintenance workflow integration should follow after contracts are fixed
- periodic maintenance mode, if implemented, should come after one-shot maintenance works reliably
- verification artifacts may be prepared in parallel once contracts are stable

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
- The bot already has a stable remembered home and chest workflow from prior milestones.
- Existing deposit logic already protects equipped or reserved gear and can be reused safely.
- Current gather-wood behavior is reliable enough to be composed into a stock-maintenance loop.
- Chest contents can be inspected through the existing storage utility layer or a modest extension of it.

### Risks
- Chest stock counting may be inconsistent if item categorization is too narrow or too broad.
- Periodic maintenance could become noisy or intrusive if scheduling and cooldown behavior are weak.
- If nearby trees are depleted, the bot may appear stuck unless failure and partial-completion messaging is explicit.
- Maintenance may conflict with manual workflows if task locking is not respected rigorously.

### Open questions
- Should the first version maintain only logs, or should planks count toward the stock target as well?
- Should maintenance mode run on a fixed interval, a tick-based interval, or only on explicit command for the first implementation?
- Should the bot deposit partial results immediately when inventory is near full, or only at the end of a refill attempt?

## 13. Final notes for Codex
Use this section for direct implementation instructions.

Preserve the current modular architecture and integrate this feature through the capability registry, task manager, and shared utilities.

Prefer composing the new maintenance workflow from existing gather / go-home / deposit behaviors instead of re-implementing those steps from scratch.

Keep changes localized to the relevant router, capability, state, and storage/inventory helper files. Do not rewrite unrelated capability modules unless a small contract update is required.

Preserve deposit-all exclusions for equipment and reserved tools exactly or strengthen them if needed. Do not regress that behavior.

Do not broaden this run into generalized autonomous resource management. Focus on wood stock only.

If periodic maintenance is implemented, keep it disabled by default until explicitly enabled by the player.
