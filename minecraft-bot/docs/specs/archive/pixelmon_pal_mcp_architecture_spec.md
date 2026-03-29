# Pixelmon Pal Architecture Refactor - Structured Tool Runtime, Recovery Loop, and MCP Integration

## 1. Objective
Refactor the Minecraft bot from a growing collection of loosely added commands/capabilities into a structured agent runtime with explicit tool contracts, deterministic execution, bounded recovery behavior, and an MCP-facing tool layer.

### Summary
Build a new architecture layer that separates:
- Minecraft runtime control
- structured tool contracts
- policy validation and execution orchestration
- bounded planner / agent decisioning
- MCP exposure for approved tools

This run should convert the current capability-oriented bot into a tool-runtime-first design so the LLM is selecting from well-defined actions instead of informally steering a pile of command handlers.

### Business / user goal
The current bot works for several narrow tasks, but it is becoming brittle because capabilities are being added ad hoc. That creates poor flexibility, weak recovery behavior, inconsistent tool inputs/outputs, and a structure that will degrade further as more behaviors are added. This run should establish an architecture that can support smarter task selection, better resilience, cleaner observability, easier future expansion, and safer LLM involvement.

### Definition of success
This run is successful when all of the following are true:
- the bot has a documented and implemented internal tool contract with normalized inputs and outputs
- existing useful behaviors are accessible through that tool layer rather than only through ad hoc command wiring
- the agent runtime can request approved tools through a bounded execution loop instead of directly triggering arbitrary logic
- deterministic policy and validation gates exist between the model and execution
- common failure cases produce structured error codes and bounded recovery paths
- MCP exposure exists for the approved tool surface or is implemented as the final adapter layer over the new internal tool runtime
- existing core behaviors continue to work after migration
- the refactor improves structure without turning the bot into an open-ended autonomous system

## 2. Current state
Describe the current system behavior and relevant baseline.

### Existing behavior
Today the project already has several good building blocks:
- a modular Mineflayer app bootstrap
- a capability registry
- a task manager with busy-state and cancellation handling
- runtime state for home, chest, crafting table, preferred tools, task status, last failure, and wood-maintenance state
- exact command parsing plus bounded LM Studio intent classification
- multiple capability modules for gathering, depositing, crafting, following, movement, and status
- a periodic wood-maintenance loop that already composes existing behaviors

However, the current design is still centered around command/capability execution rather than an explicit tool-runtime contract. The LLM currently maps chat into allowed actions, but there is no formal planner-facing tool schema, standardized recovery envelope, or dedicated policy layer between model intent and execution.

### Relevant files / components
- `index.js`
- `package.json`
- `src/bot/app.js`
- `src/bot/chat-runtime.js`
- `src/bot/command-parser.js`
- `src/bot/intent-router.js`
- `src/bot/intent-catalog.js`
- `src/bot/capability-registry.js`
- `src/bot/task-manager.js`
- `src/bot/state.js`
- `src/bot/helpers.js`
- `src/bot/lm-studio.js`
- `src/bot/capabilities/index.js`
- `src/bot/capabilities/gather-wood.js`
- `src/bot/capabilities/deposit.js`
- `src/bot/capabilities/maintain-wood.js`
- `test/`
- `specs/`

### Existing constraints
- Runtime remains Node.js with Mineflayer and the existing plugin stack.
- Existing useful commands and capabilities must continue to function after the refactor.
- Existing busy-state / cancellation behavior through `TaskManager` must be preserved or upgraded, not bypassed.
- Existing remembered state such as home, chest, and crafting-table positions must be preserved.
- Existing bounded-intent principles must remain in place; this refactor must not become unrestricted autonomy.
- Existing LM Studio integration may remain as the planner/classifier endpoint, but it must be bounded behind the new tool-runtime structure.
- This run should improve architecture first. It must not become a giant gameplay expansion.

## 3. Requested change
Describe exactly what needs to change.

### New behavior
After this change, the project should behave as a layered system:

1. **Minecraft runtime layer**
   - Owns Mineflayer bot access, navigation, movement helpers, inventory/chest access, crafting execution, block/entity lookup, and direct world interaction.
   - Continues to be deterministic code.

2. **Internal tool runtime layer**
   - Exposes approved mid-level tools with explicit schemas, metadata, and normalized result envelopes.
   - Tools should be planner-safe and meaningful, such as `gather_logs`, `deposit_items`, `inspect_inventory`, `inspect_chest_stock`, `craft_item`, `ensure_chest_access`, `go_home`, and `recover_from_stuck`.
   - Tools must report structured results including success/failure, observations, error codes, retryability, and side-effect summaries.

3. **Policy / execution layer**
   - Validates proposed tool calls before execution.
   - Applies deterministic safety and state rules such as busy checks, argument validation, permission checks, known-location requirements, cooldown rules, and maximum retry rules.
   - Invokes tools through task-manager-safe execution.

4. **Planner / agent loop**
   - Receives objective plus bounded runtime summary.
   - Selects from the approved tool catalog only.
   - Cannot directly call Mineflayer or bypass policy.
   - Uses tool results to determine the next approved action.
   - Stops when the goal is complete, blocked, cancelled, or reaches a configured iteration / failure limit.

5. **MCP adapter layer**
   - Exposes the approved tool runtime through an MCP server or MCP-compatible interface.
   - MCP is an adapter over the structured internal tool layer, not a dumping ground for arbitrary legacy functions.

### User-facing commands / inputs
The refactor should continue supporting current user interaction styles while routing through the new architecture:
- exact chat commands already present in the project
- bounded natural-language requests already allowed by the intent layer
- direct internal workflow invocations for automation such as wood maintenance
- internal planner requests for tools selected during a bounded objective-execution loop
- MCP tool requests if an external MCP-capable agent is used in front of the bot

At minimum, the architecture must support migration of the existing core tasks into the new runtime:
- gather wood
- deposit items
- inspect inventory / status
- inspect and maintain wood stock
- go home
- craft core resource items and starter tools

### Expected outputs
The system should produce:
- a normalized tool catalog with descriptions, input schemas, output schemas, and failure codes
- structured tool execution results
- planner-safe execution traces and logs
- clearer player-facing confirmations and failure messages
- deterministic recovery decisions for common failure conditions
- an MCP-facing interface that mirrors the approved internal tool set
- preserved or improved tests around migrated behavior

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- Introduce a formal internal tool contract and result envelope
- Introduce a dedicated tool registry distinct from or layered over the current capability registry
- Define tool metadata including arguments, preconditions, side effects, retryability, and categories
- Add a policy / validation layer between planner output and execution
- Add a bounded planner / executor loop for approved tools
- Add deterministic recovery handling for common failure classes
- Migrate the current highest-value capabilities into the new tool system
- Add MCP exposure as an adapter over the approved tool runtime
- Preserve and rewire existing command and bounded-intent entry points onto the new architecture
- Add or update tests for contract validation, planner gating, and migrated tools
- Document the architecture clearly enough for Technomancy implementation

### Out of scope
- Full open-ended autonomous Minecraft gameplay
- Raw low-level movement tools exposed directly to the model
- Combat, combat planning, or survival strategy
- Base building or blueprint construction systems
- Pixelmon-specific mechanics beyond preserving compatibility with the project direction
- Long-term persistent storage beyond what is required for the architecture refactor
- Replacing LM Studio with a different model provider unless strictly required to complete the architecture
- Creating dozens of new tools unrelated to existing current workflows
- Multibot coordination

### Future scope
- Multi-resource stock management beyond wood
- Construction planning and blueprint execution
- External dashboards and operator controls
- Better memory and long-horizon planning
- Multi-agent collaboration over the MCP tool layer
- Richer observability and replay tooling
- Queueing and scheduling of multiple objectives

## 5. Functional requirements
List the required behaviors.

### Requirement 1 - Internal tool contract
The project must define a formal internal tool contract for every planner-callable action. Each tool definition must include at minimum:
- stable name
- description
- input schema
- output schema
- preconditions
- side effects
- retryability flag or retry policy hints
- error codes
- optional estimated cost/duration metadata

### Requirement 2 - Normalized tool result envelope
Every tool execution must return a normalized result shape rather than arbitrary custom payloads. At minimum, results must include:
- `ok`
- `status`
- `toolName`
- `message`
- `data`
- `observation`
- `errorCode` when failed
- `retryable`
- `sideEffects`
- `metrics` or lightweight execution metadata where practical

### Requirement 3 - Mid-level tool granularity
Planner-callable tools must be mid-level and meaningful. Tools must not expose raw twitch controls such as individual movement steps or arbitrary Mineflayer calls. They should represent bounded actions like gathering, crafting, moving to a known location, inspecting state, or depositing items.

### Requirement 4 - Policy gate before execution
All planner-requested tool calls must pass through a policy gate that performs:
- tool existence checks
- argument validation
- busy/task-state validation
- precondition checks
- allowed-tool checks
- retry / cooldown checks
- optional target/location checks

Invalid or disallowed tool calls must fail safely before world interaction begins.

### Requirement 5 - Deterministic recovery handling
The runtime must implement deterministic recovery rules for common failures instead of relying on the LLM to improvise. At minimum, common failure classes should include:
- no known chest
- no reachable chest
- no logs found nearby
- insufficient crafting materials
- inventory full
- pathfinding failure
- tool missing or wrong tool equipped where relevant
- task cancelled
- runtime busy
- stuck / not making movement progress

For these cases, the runtime should either:
- retry under bounded rules
- trigger a deterministic helper action
- surface a structured blocked result to the planner
- abort cleanly

### Requirement 6 - Planner loop boundedness
The planner / executor loop must remain bounded. It must:
- use only approved tools
- stop on completion, cancellation, or blocked state
- enforce max step / iteration limits
- enforce max repeated failure / retry thresholds
- record recent tool calls and outcomes
- refuse unsupported goals cleanly

### Requirement 7 - Existing command compatibility
Existing core player-facing commands and bounded natural-language task routing must continue to work after the refactor. They may be rewired to call the new tool runtime internally, but their user-facing utility must remain intact.

### Requirement 8 - MCP as adapter, not core logic dump
MCP exposure must reflect the approved internal tool system. MCP tools must be backed by the internal runtime and policy layer. The implementation must not simply expose arbitrary legacy helper functions or bypass internal validation because a call arrived through MCP.

### Requirement 9 - Shared authoritative state
State used by tools, execution policy, and recovery logic must come from shared authoritative state rather than scattered local variables. Existing runtime state should be extended where needed to support:
- current objective
- current plan step or active tool
- recent tool history
- failure streak or retry counts
- known resource anchors such as home/chest/crafting table
- maintenance settings
- stuck-detection metadata if implemented

### Requirement 10 - Migration of current high-value workflows
At minimum, the following current behaviors must be migrated onto the new architecture and remain functional:
- gather wood
- deposit items
- inspect inventory / status
- go home
- inspect wood stock
- maintain wood stock
- craft chest / crafting table / planks / sticks / basic starter tools that already exist

## 6. Technical requirements
Document implementation expectations.

### Language / framework
- Node.js (CommonJS unless an isolated module requires otherwise)
- Mineflayer
- `mineflayer-pathfinder`
- `mineflayer-collectblock`
- existing local LM Studio integration unless a thin abstraction is introduced
- MCP server implementation in Node.js if added in this run

### Required libraries
- existing project dependencies already in `package.json`
- minimal additional MCP dependency only if required for a clean server implementation

Avoid adding large orchestration frameworks or replacing the existing project stack.

### Required patterns to preserve
- Existing Mineflayer bootstrap and plugin model in `src/bot/app.js`
- Existing task mediation concept in `src/bot/task-manager.js`
- Existing runtime state authority in `src/bot/state.js`
- Existing modular file layout under `src/bot/`
- Existing bounded-intent principles from the current command / intent system
- Existing test-first or regression-aware approach shown in `test/`

### Forbidden changes
- Do not expose raw Mineflayer APIs directly to the planner or MCP client.
- Do not let the LLM bypass the policy gate or task manager.
- Do not collapse the architecture back into a single giant chat handler.
- Do not remove busy-state, cancellation, or failure reporting safeguards.
- Do not rewrite every existing capability at once if an adapter migration path works.
- Do not broaden the project into open-ended autonomy or unrelated game features.
- Do not make MCP the only way to use tools; internal runtime usage must remain first-class.

## 7. Data and contracts
Define any important interfaces.

### Inputs
Expected input types include:
- player chat messages
- normalized command payloads
- normalized intent payloads
- internal objective payloads for planner-driven execution
- MCP tool requests
- current runtime state snapshots
- world observations returned by deterministic helpers

### Outputs
Expected outputs include:
- normalized tool definitions
- normalized tool execution results
- normalized policy-validation results
- player-facing confirmation / failure messages
- planner loop execution traces
- structured logs and testable state transitions

### Internal contracts
The exact names may vary, but the system must implement contracts equivalent to the following.

#### Tool definition contract
```json
{
  "name": "gather_logs",
  "description": "Gather logs from nearby reachable trees.",
  "category": "resource",
  "inputSchema": {
    "type": "object",
    "properties": {
      "targetCount": { "type": "integer", "minimum": 1 },
      "searchRadius": { "type": "integer", "minimum": 1 },
      "preferredLogTypes": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "required": ["targetCount"]
  },
  "preconditions": [
    "bot_spawned",
    "not_busy_or_policy_allows_queue",
    "world_accessible"
  ],
  "sideEffects": [
    "movement",
    "block_breaking",
    "inventory_change"
  ],
  "retryPolicy": {
    "retryable": true,
    "maxRetries": 1
  },
  "errorCodes": [
    "NO_LOGS_FOUND",
    "PATH_FAILED",
    "INVENTORY_FULL",
    "TASK_CANCELLED"
  ]
}
```

#### Tool result contract
```json
{
  "ok": true,
  "status": "completed",
  "toolName": "gather_logs",
  "message": "Collected 16 logs.",
  "data": {
    "collected": 16,
    "requested": 16
  },
  "observation": {
    "inventoryLogCount": 24,
    "lastKnownPosition": { "x": 10, "y": 64, "z": -3 }
  },
  "errorCode": null,
  "retryable": false,
  "sideEffects": [
    "movement",
    "inventory_change"
  ],
  "metrics": {
    "durationMs": 8421
  }
}
```

#### Policy validation contract
```json
{
  "allowed": true,
  "toolName": "deposit_items",
  "normalizedArgs": {
    "mode": "wood",
    "target": "saved",
    "amount": 32
  },
  "reason": null,
  "failureCode": null
}
```

#### Objective execution contract
```json
{
  "goal": "restock saved chest wood to threshold",
  "constraints": {
    "maxSteps": 8,
    "allowTools": [
      "inspect_chest_stock",
      "gather_logs",
      "go_home",
      "deposit_items",
      "craft_chest",
      "ensure_chest_access"
    ]
  },
  "context": {
    "knownChest": true,
    "currentWoodStock": 12,
    "targetWoodStock": 64,
    "busy": false
  }
}
```

#### Recovery contract
A deterministic recovery handler must be able to consume a failed tool result and either produce:
- a bounded retry decision
- a deterministic follow-up tool request
- a blocked/abort result

Example conceptual shape:
```json
{
  "handled": true,
  "strategy": "follow_up_tool",
  "nextTool": "craft_chest",
  "args": {},
  "reason": "NO_CHEST_FOUND"
}
```

## 8. Error handling
Describe how failure must work.

### Failure cases
- tool requested but not registered
- planner proposes unsupported or malformed args
- runtime already busy with another task
- chest/home/crafting table memory missing
- chest or target block no longer exists or is unreachable
- inventory full during gather or craft flow
- no reachable logs or stone nearby
- pathfinder fails or bot becomes stuck
- missing materials for craft or placement
- task cancellation or disconnect
- repeated failure loop during planner execution
- MCP request arrives for a disallowed tool or invalid payload

### Required failure behavior
- Failures must return normalized result envelopes and stable failure codes.
- Validation failures must be rejected before world interaction begins.
- Player-facing messages must remain concise, useful, and non-technical where possible.
- Internal logs must capture enough structure to understand which tool failed, why, and whether a retry was attempted.
- Recovery attempts must be bounded and observable.
- A failed planner step must not silently continue forever.
- Cancellation must stop work cleanly and leave task state consistent.

### Recovery rules
- Prefer deterministic recovery over LLM improvisation for known failures.
- At most one bounded retry should occur for a transient tool failure unless a specific tool contract defines otherwise.
- If a deterministic helper action can resolve the failure safely, perform it through the same policy/tool system.
- If the failure cannot be safely recovered, return a blocked result to the planner or player.
- Repeated identical failures in one objective loop must trip an abort condition.
- Recovery actions must themselves be logged and counted toward execution limits.

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1 - Existing command path preserved through new runtime
**Given:** the bot is online and the player issues an existing supported wood-gathering command  
**When:** the command is processed after the refactor  
**Then:** the request is routed through the new policy/tool runtime, executes successfully, and still behaves correctly from the player’s perspective

### Scenario 2 - Planner cannot bypass policy
**Given:** the planner proposes a tool that is not in the allowlist or provides invalid arguments  
**When:** the execution layer receives that proposal  
**Then:** the request is rejected before world interaction begins, a structured validation failure is returned, and the bot does not crash

### Scenario 3 - Deterministic recovery on missing chest
**Given:** an objective requires depositing wood into a saved chest but the chest is missing or unavailable  
**When:** the deposit tool fails with the corresponding failure code  
**Then:** the runtime either performs an allowed deterministic recovery path such as `ensure_chest_access` / `craft_chest` if policy and materials allow, or returns a blocked result with a structured explanation

### Scenario 4 - Bounded objective execution
**Given:** an objective such as maintaining wood stock is started through the planner loop  
**When:** the loop runs  
**Then:** it uses only approved tools, records each step, stops on completion or bounded failure, and never enters an infinite action loop

### Scenario 5 - MCP adapter uses same internal contracts
**Given:** an MCP client requests an approved tool with valid arguments  
**When:** the request is executed through the MCP server  
**Then:** the same policy layer, tool contract, and normalized result envelope are used as with internal runtime execution

### Scenario 6 - Busy-state safety remains intact
**Given:** the bot is already executing a cancellable task  
**When:** a new planner or MCP tool request arrives that is not allowed concurrently  
**Then:** the request is rejected or deferred according to policy and the current task is not silently interrupted

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- Verify that existing chat commands for wood gather, deposit, status, inventory, and home movement still work.
- Verify that a planner-driven objective can complete a bounded multi-step workflow using approved tools only.
- Verify that invalid planner proposals are rejected safely.
- Verify that missing-chest or unreachable-target failures produce structured, visible recovery behavior.
- Verify that MCP-exposed tools behave the same as internally invoked tools.
- Verify that cancellation still stops active work cleanly.

### Automated verification
- Unit tests for tool definition validation
- Unit tests for normalized result envelopes
- Unit tests for policy gate validation and argument normalization
- Unit tests for deterministic recovery handler decisions
- Integration tests for migrated tools such as gather, deposit, and maintain wood
- Integration tests for planner-loop step bounds and repeated-failure abort behavior
- Integration tests or smoke tests for MCP requests against approved tools
- Regression tests for exact command routing and bounded natural-language routing

### Regression requirements
The following existing behaviors must still work after this run:
- exact command handling
- bounded natural-language task routing
- task busy-state / stop behavior
- remembered home/chest behavior
- gather wood flow
- deposit flow
- wood stock maintenance flow
- status and inventory reporting
- basic crafting flows that already exist

## 11. Technomancy execution contract

### Run classification
large

### Agent structure
- Arch Technomancer: 1
- High Technomancer: 3
- Technomancers per High: 2

### Parallelism rules
This run should be divided into three milestones.

**Milestone 1 - Internal tool runtime and contracts**
- Must begin first.
- Defines tool contract, result envelope, tool registry, policy interfaces, and migration adapters.
- Can parallelize contract design, registry implementation, and migrated-tool adapter work once the contract is approved.

**Milestone 2 - Planner loop and deterministic recovery**
- Begins after Milestone 1 contracts are stable.
- Can parallelize planner-loop implementation and recovery-handler implementation once shared interfaces are fixed.
- Must not finalize until it uses the Milestone 1 tool runtime contracts.

**Milestone 3 - MCP adapter and entry-point rewiring**
- Begins after Milestone 1 tool runtime exists.
- May proceed in parallel with late Milestone 2 work if interfaces are already stable.
- Includes MCP server exposure, command/intent rewiring, and regression validation.

Must remain sequential where contract changes would break downstream work. Contract-first execution is mandatory.

### Communication rules
- Arch communicates through strategic artifacts.
- High Technomancers communicate through approved shared artifacts only.
- Technomancers communicate only within their assigned milestone swarm.
- Cross-swarm coordination must escalate upward.
- Contract changes affecting another milestone must be written into explicit handoff artifacts before downstream implementation proceeds.

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

Additional required implementation artifacts for this run:
- `docs/architecture/tool_runtime.md`
- `docs/architecture/mcp_adapter.md`
- `docs/architecture/recovery_policy.md`
- `docs/architecture/planner_loop.md`
- `docs/contracts/tool_definitions/*.json` or equivalent contract snapshots if a contract folder is introduced

### Completion gates
The run is not complete until:
- the internal tool contract exists and is implemented
- migrated high-value workflows run through the new runtime
- planner execution is bounded and verified
- deterministic recovery is implemented for documented common failure modes
- MCP exposure is wired to the same policy/tool runtime
- regression tests pass
- verification is documented
- milestone sign-off is written
- final Arch Technomancer summary is written

## 12. Risks and assumptions

### Assumptions
- The current project structure is stable enough to support an adapter-style refactor rather than a total rewrite.
- Existing capability modules can be wrapped or migrated into tool implementations incrementally.
- LM Studio can continue to serve as the bounded planner/classifier endpoint for this phase.
- MCP can be introduced as a thin interface over the internal runtime rather than requiring architectural inversion.

### Risks
- Over-refactoring could break currently working behaviors if migration is not staged carefully.
- Tool granularity could be chosen poorly, making the planner either too weak or too brittle.
- Recovery logic could become noisy or loop-prone if not carefully bounded.
- MCP implementation could accidentally bypass internal validation if treated as a parallel execution path rather than an adapter.
- Existing capability files may contain behavior-specific assumptions that are not obvious until migration begins.
- Excessive scope expansion could turn this architecture run into a gameplay-feature run.

### Open questions
- Should the internal tool registry fully replace the current capability registry, or should capabilities be adapted behind tools for one or two phases first?
- Should planner execution start as a dedicated objective runner separate from chat intent routing, then later absorb more entry points?
- Which MCP dependency or implementation style best fits the current Node.js stack with minimal overhead?
- How much recent execution history should be included in planner context by default?

## 13. Final notes for Codex
Use this section for direct implementation instructions.

- Preserve existing working behavior wherever possible by adapting current capabilities behind the new tool runtime before considering deeper rewrites.
- Prefer additive architecture changes over destructive rewrites.
- Keep the planner bounded and tool-driven.
- Make deterministic runtime and policy layers first; treat the LLM as a selector, not a god object.
- MCP must sit on top of the internal tool runtime, not beside it.
- Keep changes modular under `src/bot/` or a clearly justified adjacent architecture folder.
- Preserve current tests where possible and add targeted new ones instead of deleting broad coverage.
- Do not introduce raw movement or arbitrary world-manipulation tools into the planner-facing catalog.
- When in doubt, choose explicit contracts and smaller safe migration steps over clever implicit behavior.
