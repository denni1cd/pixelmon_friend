# Pixelmon Pal Phase 6 - Reliability, Task Safety, and Observability Hardening

## 1. Objective
Stabilize the current Minecraft worker bot so completed capabilities and bounded LLM intent routing behave predictably, fail safely, and are easier to debug.

### Summary
Build a hardening milestone that improves task execution safety, busy-state accuracy, state consistency, error handling, validation, and logs across the existing worker loops and bounded natural-language layer. This run should make the bot trustworthy enough to expand further without piling new features onto fragile behavior.

### Business / user goal
The bot now has real capabilities and a bounded natural-language layer, but it still feels wonky. Players can sometimes get useful behavior, but inconsistencies around busy state, action routing, task interruption, invalid LLM output, path failures, and state drift reduce trust. This milestone should make the bot feel dependable before additional user-facing expansion.

### Definition of success
This run is successful when:
- existing worker loops can be executed repeatedly with fewer manual resets
- the bot clearly reports what it is doing, why it failed, and whether it is available
- bounded LLM intent output is validated consistently before execution
- overlapping task execution is prevented or handled deliberately
- stop / cancel behavior is predictable and leaves the bot in a safe state
- state for home, chest, crafting table, preferred tools, and active task remains internally consistent
- logs and status outputs are good enough to diagnose failures without guessing
- all current exact commands and approved natural-language task mappings continue to work

## 2. Current state
Describe the current system behavior and relevant baseline.

### Existing behavior
Today the bot can:
- join a local supported Minecraft world and respond to chat
- use LM Studio for bounded natural-language intent mapping and conversational replies
- gather wood, return home, and deposit into the configured chest
- craft planks, sticks, crafting table, and chest
- remember home and chest locations
- craft and equip wooden and stone tools
- gather cobblestone, return, deposit, and upgrade tool quality
- route completed actions through the modular capability registry and task manager

The bot is functional but still somewhat unreliable. It can mis-handle task overlap, fail unclearly, drift in remembered state, or produce confusing outcomes when LLM intent routing and task execution interact under imperfect conditions.

### Relevant files / components
- `src/index.js`
- `src/core/chatRouter.js`
- `src/core/capabilityRegistry.js`
- `src/core/taskManager.js`
- `src/core/state.js`
- `src/core/llmClient.js`
- `src/core/logger.js`
- `src/prompts/`
- `src/capabilities/`
- `src/utils/inventory.js`
- `src/utils/movement.js`
- `src/utils/players.js`
- `src/utils/blocks.js`
- `src/utils/crafting.js`
- `src/utils/storage.js`

### Existing constraints
- Runtime remains Node.js with Mineflayer and the current modular architecture.
- LM Studio remains the local LLM endpoint.
- Existing commands and completed workflows must continue to work.
- Hardening should preserve the current project structure rather than collapsing logic back into one large file.
- Natural-language task execution must remain bounded to approved capabilities and workflow calls.
- This run should not introduce broad new gameplay features unless strictly required for stabilization.

## 3. Requested change
Describe exactly what needs to change.

### New behavior
After this change, the bot should:
- expose more reliable task lifecycle behavior from request intake through completion or failure
- reject invalid, ambiguous, unsupported, or malformed LLM-generated intent payloads consistently
- refuse or defer new work when already busy unless explicit cancellation behavior allows otherwise
- provide concise player-facing feedback for current task, busy status, failure reason, and completion
- keep remembered state for home, chest, crafting table, active task, and preferred tool data accurate across normal execution and failure paths
- support a deterministic `status`-style summary that surfaces enough state to understand what the bot believes is true
- record structured logs around routing, capability execution, failures, retries, inventory deltas, and state transitions
- fail in ways that leave the bot available for the next request rather than wedged in a half-busy state

### User-facing commands / inputs
This run should preserve and harden support for the current command and bounded natural-language surface, including but not limited to:
- wood gathering commands
- cobblestone gathering commands
- deposit / go home / home-chest workflow commands
- crafting and tool-related commands
- stop / cancel if already implemented
- inventory / status / task-report style commands
- approved natural-language requests that map onto existing implemented workflows

This run may add or improve a deterministic status command surface such as:
- `status`
- `what are you doing?`
- `what went wrong?`
- `are you busy?`

### Expected outputs
The system should:
- produce clear chat confirmations when a task starts
- produce clear chat messages when a task is refused, blocked, cancelled, or fails
- expose accurate status and last-known task information
- emit useful structured logs for debugging task routing and execution
- leave task state, locks, and memory in a consistent state after success, cancellation, or failure

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- Hardening the current task lifecycle and lock/busy behavior
- Better validation of bounded LLM intent outputs
- Improved state consistency and memory hygiene for current worker flows
- Better player-facing status, busy, and failure messaging
- Retry / timeout / abort rules for existing tasks where needed
- Structured logging and observability for existing workflows
- Stabilization of wood, crafting, deposit, tool, and cobblestone loops
- Safer cancellation / stop behavior for already implemented workflows
- Regression coverage for existing commands and bounded natural-language requests

### Out of scope
- New major gameplay branches such as farming, blueprint building, or house construction
- New Pixelmon mechanics
- Open-ended planning or agent autonomy
- Voice input or non-chat control surfaces
- Major architectural rewrites that replace the existing modular registry/task structure
- Expanding the action catalog beyond what is needed for stabilization
- Adding a full external database, web dashboard, or remote service layer

### Future scope
- Better natural-language flexibility after the hardening pass
- Tiny blueprint building and construction workflows
- Clarification questions for ambiguous user requests
- More advanced task queueing and chained multi-step plans
- Farming, smelting, and richer survival automation

## 5. Functional requirements
List the required behaviors.

### Requirement 1
The bot must maintain a reliable active-task lifecycle with clear states such as idle, starting, running, cancelling, failed, and completed, or an equivalent simplified model that still prevents inconsistent overlap.

### Requirement 2
The bot must prevent uncontrolled concurrent task execution. If a new request arrives while the bot is busy, the bot must either refuse it clearly or handle it according to an explicit supported cancellation / replacement rule.

### Requirement 3
The bounded LLM intent layer must validate action names, argument shapes, and supported workflows before execution. Invalid or unsupported payloads must be rejected without reaching capability execution.

### Requirement 4
The bot must expose a deterministic status report that includes, at minimum, current task or idle state, remembered home/chest state if relevant, and last failure summary if one exists.

### Requirement 5
Stop or cancel behavior must leave the bot in a safe, reusable state. After cancellation, the bot should not remain falsely marked busy or continue orphaned task behavior silently.

### Requirement 6
Current resource loops must be hardened for repeated use, including:
- gather wood
- return home
- deposit to chest
- craft core wooden resources
- gather cobblestone
- craft/equip wooden tools
- craft/equip stone tools

### Requirement 7
The bot must surface clearer failure reasons to the player where possible, such as missing materials, chest unavailable, no reachable resource nearby, blocked crafting, pathfinding failure, invalid request, or already busy.

### Requirement 8
The bot must record useful execution logs including routed intent, chosen capability/workflow, task start/end, failure cause, and important state transitions.

### Requirement 9
The bot must preserve exact command behavior and approved natural-language workflow behavior from previous milestones unless an intentional hardening change requires a clearer failure path.

### Requirement 10
The hardening pass must avoid introducing user-facing randomness or hidden behavior changes that make debugging harder.

## 6. Technical requirements
Document implementation expectations.

### Language / framework
Node.js with Mineflayer, the current modular capability architecture, and LM Studio as the local OpenAI-compatible endpoint.

### Required libraries
- `mineflayer`
- `mineflayer-pathfinder`
- `mineflayer-collectblock`
- `minecraft-data`
- existing LM Studio client utilities
- existing project task, registry, state, and logging utilities

Do not add a new orchestration framework or replace the current architecture in this run unless strictly necessary for stabilization.

### Required patterns to preserve
- Existing modular capability file layout
- Existing capability registry and task manager mediation
- Existing chat-router separation between exact commands and bounded natural-language routing
- Existing LM Studio integration pattern where practical
- Existing home / chest / crafting table memory model unless a local cleanup is required
- Existing config/startup flow for local Prism + Mineflayer testing on supported versions
- Existing project artifact and documentation conventions used in prior Technomancy runs

### Forbidden changes
- Do not add open-ended autonomy.
- Do not let the LLM call raw Mineflayer APIs directly.
- Do not collapse the system back into a single oversized runtime file.
- Do not add large unrelated feature branches such as building or farming in this run.
- Do not break existing exact command workflows in the name of cleanup.
- Do not silently broaden supported action routing without explicit validation.

## 7. Data and contracts
Define any important interfaces.

### Inputs
Expected inputs include:
- player chat messages
- exact command payloads
- bounded natural-language chat messages
- validated LLM intent payloads
- current inventory, location, world, and memory state as already exposed in the runtime
- task-manager lifecycle state
- capability execution results and failure messages

### Outputs
Expected outputs include:
- validated execution requests for approved capabilities / workflows
- player-facing chat confirmations, refusals, status messages, and failure summaries
- structured logs for routing, execution, retry, cancel, and failure paths
- updated state snapshots for active task, home/chest/crafting table memory, and preferred tool data

### Internal contracts
Important internal contracts should include:
- a single authoritative source of truth for active task / busy state
- validated intent payloads must normalize to a deterministic schema before execution, for example:
  ```json
  {
    "action": "gather_wood_and_deposit",
    "args": {
      "count": 32
    }
  }
  ```
- capability execution must remain task-manager-mediated rather than being invoked ad hoc from chat parsing code
- status reporting must read from shared state rather than inferred local variables scattered across files
- last-failure information, if tracked, must be written and cleared consistently
- cancellation / completion / failure paths must all release locks and update shared state deterministically

## 8. Error handling
Describe how failure must work.

### Failure cases
- LM Studio unavailable, timeout, or malformed response
- invalid LLM intent payload or unsupported action
- overlapping task request while busy
- missing remembered home, chest, or crafting table when required
- inventory full or missing required items/materials
- pathfinding failure or unreachable target
- crafting failure due to missing recipe or missing table access
- deposit failure due to container access or placement issues
- cancellation during an active workflow
- stale or inconsistent remembered state

### Required failure behavior
The bot must:
- fail safely without crashing the chat loop or wedging the task manager
- report concise player-facing error messages
- preserve the ability to accept new requests after failure once state is safely reset
- log enough detail to diagnose the failure
- avoid partial execution when validation fails before task start
- avoid remaining in a false busy state after failure or cancellation

### Recovery rules
After failure:
- shared task state must return to a known safe state
- locks must be released deterministically
- remembered home/chest/crafting table state must only be cleared if the implementation can justify that the memory is invalid
- exact commands and status queries must still function
- the bot should be able to accept the next safe request without a process restart where possible

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1
**Given:** the bot is idle, home/chest memory is set, and a player requests an existing workflow such as wood gathering and deposit  
**When:** the task executes successfully  
**Then:** the bot should report task start, complete the workflow, report completion, and return to an idle/available state with accurate status.

### Scenario 2
**Given:** the bot is already running a resource workflow  
**When:** a player issues a second task request  
**Then:** the bot should refuse or defer the new task according to the supported rule, clearly report that it is busy, and avoid corrupting the current task state.

### Scenario 3
**Given:** an LLM intent response is malformed, unsupported, or missing required arguments  
**When:** the chat router receives that payload  
**Then:** the bot must refuse execution, report that it could not understand or support the request, and remain available for exact commands.

### Scenario 4
**Given:** a running workflow encounters a recoverable execution failure such as missing nearby resource or pathfinding failure  
**When:** the failure occurs  
**Then:** the bot should report a concise failure reason, release busy/task state correctly, and expose the failure through status or logs.

### Scenario 5
**Given:** the player issues a stop/cancel request during a currently supported cancellable workflow  
**When:** the cancellation path completes  
**Then:** the bot should stop safely, report cancellation, and return to a reusable idle state without ghost actions continuing.

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- Verify that existing exact commands for wood, cobble, crafting, deposit, tools, and status still work.
- Verify that current approved natural-language requests still map to the correct workflow or safe refusal.
- Verify that the bot reports busy state clearly when a second task is issued mid-execution.
- Verify that cancellation leaves the bot reusable.
- Verify that a failure in one workflow does not require restarting the process before issuing a new safe command.
- Verify that status output reflects real current state after success, failure, and cancellation.

### Automated verification
- Unit tests for intent validation and allowlist enforcement
- Unit tests for task-state transitions and lock release behavior
- Unit tests for status/last-failure formatting
- Integration tests for exact command routing and approved LLM intent routing
- Integration or smoke tests for wood loop, deposit loop, crafting loop, and cobblestone/tool loop under nominal conditions
- Smoke test for failure handling on malformed intent payloads and busy-state overlap

### Regression requirements
The following must still work after the hardening run:
- bot startup and connection flow
- exact command parsing
- home/chest memory usage
- wood gathering and deposit loop
- core crafting loop
- wooden and stone tool crafting/equip logic
- cobblestone loop
- bounded natural-language routing for already approved workflows

## 11. Technomancy execution contract

### Run classification
medium-large

### Agent structure
- Arch Technomancer: 1
- High Technomancer: 2
- Technomancers per High: 2-3

### Parallelism rules
Parallelizable work:
- logging/observability design and implementation
- task-state/status hardening
- intent validation hardening
- regression verification artifacts

Sequential dependencies:
- shared task lifecycle and state contract must be defined before dependent implementation spreads across capabilities
- intent validation changes must align with current capability/workflow allowlist before chat-router integration is finalized
- final verification must occur only after all touched task and routing flows converge on the same state contract

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
- The current modular architecture and capability registry already exist and are the correct base for hardening.
- LM Studio remains available locally for bounded intent-routing tests.
- Supported Minecraft runtime/version setup remains unchanged during this run.
- Existing capabilities are good enough to stabilize without redesigning the full worker model.

### Risks
- Hardening may expose hidden assumptions or inconsistent state handling across previously added capabilities.
- Logging and status additions may tempt broad refactors if not tightly scoped.
- Cancellation and busy-state cleanup may be harder than expected if current workflows do not share a clean lifecycle contract.
- The natural-language layer may still feel limited even after reliability improves because flexibility is intentionally bounded.

### Open questions
- Should last-failure details persist until replaced, or should they clear after the next successful task?
- Which existing workflows are explicitly cancellable versus only safely stoppable at defined checkpoints?
- Should status output be a single command only, or should conversational variants map onto the same deterministic formatter?

## 13. Final notes for Codex
Use this section for direct implementation instructions.

Preserve the current modular project structure.
Prefer tightening shared contracts over rewriting every capability from scratch.
Keep state, task, and logging improvements localized to the existing task-manager / router / state architecture where possible.
Do not broaden the gameplay feature surface in this run.
Favor deterministic status messages and validation over cleverness.
When behavior must change, choose the clearer and safer failure mode rather than silent best-effort behavior.
