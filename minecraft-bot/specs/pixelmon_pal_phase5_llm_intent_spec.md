# Pixelmon Pal Phase 5 - Bounded LLM Intent Mapping and Workflow Routing

## 1. Objective
Add a controlled natural-language layer to the Minecraft bot so players can issue ordinary chat requests and have the bot map them onto already-implemented capabilities and workflows.

### Summary
Build a bounded LM Studio intent-mapping layer that interprets natural-language Minecraft chat and converts it into deterministic capability calls against the existing registry and task manager. This run must not turn the bot into an open-ended autonomous agent. It should only make completed capabilities easier to invoke.

### Business / user goal
The bot already has real worker capabilities, but the current user experience is still command-like and brittle. This milestone should let the player say things like “go get some wood for us,” “stock the chest with cobble,” or “make me a stone pickaxe,” and have the bot route those requests into explicit workflows instead of requiring exact command syntax.

### Definition of success
This run is successful when the bot can:
- accept bounded natural-language requests in chat
- map those requests into approved capability or workflow calls
- extract relevant parameters such as counts or item/tool names when they are clearly present
- confirm the interpreted action back to the player before execution when appropriate
- reject unsupported or ambiguous requests safely
- preserve all exact command-based behavior as a fallback path
- avoid freeform planning, raw movement control, or invented capabilities

## 2. Current state
Describe the current system behavior and relevant baseline.

### Existing behavior
Today the bot can:
- join the local Minecraft world and respond to chat
- use LM Studio for limited reply/chat behavior
- gather wood and deposit it via the existing home/chest workflow
- craft planks, sticks, crafting table, and chest
- craft and equip wooden and stone tools
- gather cobblestone and run the stone resource loop
- manage capabilities through the modular capability registry and task manager

The bot still relies heavily on exact command forms. It does not yet reliably interpret natural-language requests as bounded capability calls.

### Relevant files / components
- `src/index.js`
- `src/core/chatRouter.js`
- `src/core/capabilityRegistry.js`
- `src/core/taskManager.js`
- `src/core/state.js`
- `src/core/llmClient.js`
- `src/capabilities/gatherWood.js`
- `src/capabilities/depositToChest.js`
- `src/capabilities/gatherCobblestone.js`
- `src/capabilities/craftPlanks.js`
- `src/capabilities/craftSticks.js`
- `src/capabilities/craftCraftingTable.js`
- `src/capabilities/craftChest.js`
- `src/capabilities/craftWoodenAxe.js`
- `src/capabilities/craftWoodenPickaxe.js`
- `src/capabilities/craftStoneAxe.js`
- `src/capabilities/craftStonePickaxe.js`
- `src/utils/inventory.js`
- `src/utils/movement.js`
- `src/prompts/`

### Existing constraints
- Runtime remains Node.js with Mineflayer-based control.
- LM Studio remains the local LLM endpoint.
- Existing exact commands must continue to work unchanged.
- Capability execution remains registry-driven and task-manager-controlled.
- Natural-language interpretation must stay bounded to known capabilities and known workflow patterns.
- The LLM must not directly issue raw Mineflayer calls or bypass the capability/task layer.
- This run should reuse the current modular structure, not re-centralize logic.

## 3. Requested change
Describe exactly what needs to change.

### New behavior
After this change, the bot should be able to:
- detect whether a chat message is a direct command, a bounded natural-language task request, or ordinary conversation
- use LM Studio to map eligible natural-language task requests into a structured intent object
- validate the returned intent against an allowlisted action catalog
- execute the mapped capability or workflow through the existing registry/task manager
- reply with a short confirmation such as “Getting 32 wood and bringing it to the chest.”
- reject unsupported requests such as combat, exploration, or building requests that are not yet implemented
- fall back safely when the model output is invalid, missing, ambiguous, or out of scope

### User-facing commands / inputs
At minimum, support natural-language phrases equivalent to the current and newly completed workflows, such as:
- “go get some wood for us”
- “bring back 32 logs”
- “stock the chest with cobblestone”
- “make a stone pickaxe”
- “craft planks from the wood you have”
- “go home”
- “put everything in the chest”
- “what are you carrying?”
- “what are you doing?”

Direct exact commands should continue to work, including the existing explicit forms for wood, cobble, crafting, tool equip, inventory, and status.

### Expected outputs
The system should:
- produce a validated structured intent object before execution
- execute only allowlisted actions with validated arguments
- send clear chat confirmations, progress, and failure messages
- preserve the ability to use exact commands if the LLM layer is unavailable or produces invalid output
- log or surface invalid-intent cases without crashing task execution

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- A bounded intent schema for natural-language requests
- LM Studio prompt(s) and parsing logic for intent extraction
- Validation of returned intents against an allowlist of supported actions
- Routing from validated intent objects into existing capability/workflow execution
- Parameter extraction for clearly expressed counts and simple item/tool names
- Safe fallback behavior when model output is invalid or unsupported
- Preservation of existing exact command routing
- Manual and automated verification for natural-language invocation of completed capabilities

### Out of scope
- Open-ended autonomous planning
- Raw movement or low-level action generation by the LLM
- Multi-step reasoning beyond supported workflows
- New game capabilities that do not already exist or are not explicitly added in this run
- Freeform building requests
- Combat, survival strategy, or exploration autonomy
- Pixelmon-specific intent handling
- Voice input or non-chat interfaces

### Future scope
- Multi-resource plans such as “get wood and stone for us”
- Clarification questions when user intent is underspecified
- Natural-language blueprint/build requests after building capabilities exist
- Task queueing and plan summaries for more complex requests
- Better conversational memory around prior task context

## 5. Functional requirements
List the required behaviors.

### Requirement 1
The bot must classify incoming chat into one of these categories: exact command, bounded task request, or ordinary conversation. Exact commands should continue to bypass the LLM path.

### Requirement 2
The bot must send bounded task requests to LM Studio using a prompt that requires structured output limited to approved actions and argument shapes.

### Requirement 3
The bot must validate the returned LLM output before execution. If the action is not allowlisted, arguments are malformed, or the payload cannot be parsed, the bot must refuse execution and report that it did not understand or support the request.

### Requirement 4
The bot must support at least these natural-language intent targets if the corresponding capabilities already exist in the codebase:
- gather wood
- gather cobblestone
- deposit to chest
- go home
- inventory summary
- status summary
- craft planks
- craft sticks
- craft crafting table
- craft chest
- craft wooden axe / wooden pickaxe
- craft stone axe / stone pickaxe

### Requirement 5
The bot must support clearly expressed numeric counts when they are present, for example “get 32 wood” or “bring back 16 cobble.” If no count is provided, the implementation may use a deterministic default defined in config or code.

### Requirement 6
The bot must confirm the interpreted action in chat before or at the start of execution, using concise player-facing wording.

### Requirement 7
The bot must preserve busy-state / lock-state behavior so that a new LLM-mapped task does not silently interrupt an existing active task unless the project already supports explicit cancellation.

### Requirement 8
The bot must preserve ordinary conversational replies through LM Studio where that behavior already exists, but ordinary conversation must not accidentally trigger task execution unless the intent-routing rules positively classify the message as a bounded task request.

## 6. Technical requirements
Document implementation expectations.

### Language / framework
Node.js with Mineflayer, the existing modular capability architecture, and LM Studio as the local OpenAI-compatible endpoint.

### Required libraries
- `mineflayer`
- `mineflayer-pathfinder`
- `minecraft-data`
- existing project LM Studio client utilities
- existing capability registry and task manager utilities

No large new orchestration framework should be added for this run.

### Required patterns to preserve
- Existing capability module pattern
- Existing capability registry / task manager flow
- Existing chat router exact-command behavior
- Existing LM Studio client integration pattern where practical
- Existing state / busy / stop handling
- Existing modular file layout and Technomancy artifact conventions

### Forbidden changes
- Do not replace exact commands with LLM-only behavior.
- Do not let the LLM call Mineflayer APIs directly.
- Do not create open-ended planning loops.
- Do not add Pixelmon logic in this run.
- Do not silently broaden supported actions beyond the explicit allowlist.
- Do not rewrite unrelated capability implementations unless required for integration.

## 7. Data and contracts
Define any important interfaces.

### Inputs
Expected inputs include:
- player chat messages
- current busy/task state
- current capability registry contents or allowlisted action definitions
- current home/chest memory state
- current inventory and world state as already surfaced to capability execution
- LM Studio structured-output response payload

### Outputs
Expected outputs include:
- validated structured intent objects
- task execution requests routed into the capability/task system
- chat confirmations, progress, and refusal messages
- logs or verification artifacts for parse failures, unsupported intents, and successful mappings

### Internal contracts
Important internal contracts should include:
- the LLM intent layer must return or normalize to a deterministic schema such as:
  ```json
  {
    "action": "gather_wood_and_deposit",
    "args": {
      "count": 32
    }
  }
  ```
- every executable action must come from an explicit allowlist maintained in code or config
- the chat router must preserve the exact-command path before the LLM path where practical
- invalid or out-of-scope intent payloads must not reach capability execution
- capability execution remains task-manager-mediated rather than being directly invoked from arbitrary parsing code

## 8. Error handling
Describe how failure must work.

### Failure cases
- LM Studio is unavailable or times out
- LLM response is not parseable JSON / structured payload
- returned action is unsupported or not allowlisted
- required arguments are missing or invalid
- requested task is valid in theory but cannot run due to current world or inventory state
- a new natural-language request arrives while the bot is already busy

### Required failure behavior
The bot must:
- fail safely without crashing the chat loop or task manager
- tell the player when it did not understand or cannot support a request
- preserve exact commands as a fallback path when the LLM layer fails
- log invalid payloads and parse failures in a way that helps debugging
- avoid partial execution of a malformed or unvalidated request

### Recovery rules
After failure:
- the bot must remain available for new exact commands
- busy state must remain accurate
- no invalid task should remain half-registered in the task manager
- temporary LLM errors should not require a bot restart

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1
**Given:** the bot is idle and the completed wood resource loop exists  
**When:** a player says “go get some wood for us”  
**Then:** the bot maps the request to the approved wood workflow, confirms the interpreted action, executes it, and reports completion or clear failure.

### Scenario 2
**Given:** the bot has completed tool and cobblestone capabilities  
**When:** a player says “make me a stone pickaxe”  
**Then:** the bot maps the request to the supported crafting capability, validates required materials/preconditions, and either crafts the item or reports why it cannot.

### Scenario 3
**Given:** the player asks for an unsupported action such as “go kill mobs for me” or “build us a castle”  
**When:** the bot routes the message through the natural-language layer  
**Then:** the bot refuses safely and says that the request is not supported yet, without inventing a plan or starting a task.

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- Verify that existing exact commands still work unchanged.
- Verify that at least several natural-language variants map correctly to completed workflows.
- Verify that unsupported requests are rejected safely.
- Verify that invalid LM Studio output does not crash the bot.
- Verify that busy-state behavior remains correct under natural-language requests.

### Automated verification
- Unit test for intent-schema validation and allowlist enforcement
- Unit test for parameter extraction / normalization defaults
- Integration test for chat-router handoff from natural-language input to task execution request
- Smoke test for LM Studio unavailable / invalid payload fallback behavior

### Regression requirements
The following existing behavior must still work:
- bot connection and startup
- direct chat command routing
- home/chest memory
- wood gather and deposit loop
- crafting helpers and commands
- tool and cobblestone workflows
- ordinary non-task LM Studio chat replies where currently supported

## 11. Technomancy execution contract

### Run classification
medium

### Agent structure
- Arch Technomancer: 1
- High Technomancer: 1
- Technomancers per High: 2-3

### Parallelism rules
Sequential dependency order:
1. define the allowlisted action catalog and intent schema
2. add LM Studio prompting / structured-output parsing
3. add validation and chat-router integration
4. add verification and regression checks

Safe parallelism is allowed only after the action schema and allowlist are agreed:
- one Technomancer may work on LM Studio prompt/parse integration
- another may work on validation/helpers/tests
- router integration should happen only after the schema contract is fixed

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
- at least one natural-language success path and one refusal path are manually demonstrated

## 12. Risks and assumptions

### Assumptions
- LM Studio remains available locally through the existing integration path.
- The capability registry and task manager are stable enough to serve as the single execution entry point.
- Completed capabilities from previous phases are already functioning and available for routing.

### Risks
- The model may over-generalize or return unsupported actions unless the prompt and validation layer are tight.
- Natural-language parsing may accidentally shadow exact commands if routing order is not preserved.
- Ambiguous requests may produce inconsistent outputs if defaults are not deterministic.
- Over-broad implementation may drift into agent behavior instead of bounded routing.

### Open questions
- Should natural-language task execution require an explicit wake phrase such as `bot,` or should the router decide automatically?
- Should some actions require a confirmation step before execution, or only high-risk future actions?
- Should defaults such as implied quantity be defined globally in config?

## 13. Final notes for Codex
Use this section for direct implementation instructions.

- Preserve exact command behavior first; the natural-language layer is an addition, not a replacement.
- Prefer a small allowlisted intent schema over a broad tool-calling experiment.
- Keep changes localized to the chat router, LLM client/prompting layer, validation helpers, and minimal wiring to the registry/task manager.
- Reuse existing workflow capabilities instead of creating duplicate “LLM-only” implementations.
- Reject unsupported intents clearly instead of improvising.
- Do not expand into building, combat, Pixelmon, or general planning in this run.
