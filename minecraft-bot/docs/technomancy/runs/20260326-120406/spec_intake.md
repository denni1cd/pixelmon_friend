# Spec Intake

## Objective Summary
Add a bounded natural-language intent layer on top of the current exact-command Minecraft worker bot. The new layer must classify chat into exact commands, allowlisted task requests, or ordinary conversation; map eligible task requests through LM Studio into a structured intent object; validate that object; and execute only approved capability or workflow calls through the existing registry and task-manager path.

## Key Constraints
- Exact commands remain the primary deterministic path and must continue to work unchanged.
- Natural-language routing is additive only; it must not replace command parsing.
- The LLM may return only structured intent payloads for allowlisted actions.
- The LLM must not call Mineflayer APIs or bypass the registry/task-manager layer.
- Unsupported, ambiguous, invalid, or unparseable outputs must be rejected safely.
- Runtime stays local with LM Studio as the existing local endpoint.
- All Technomancy artifacts stay under `docs/`.

## Likely Risk Zones
- Routing order: natural-language handling must not shadow exact commands.
- Validation drift: allowlisted action names and argument shapes must stay explicit and centralized.
- LM Studio structured parsing can fail or over-generalize unless the prompt contract is tight.
- Busy-state correctness can regress if routed intents bypass existing task-manager semantics.
- Ordinary conversation must remain non-executing unless classification positively identifies a bounded task request.

## Protected Invariants
- Existing chat command behavior remains intact.
- Capability execution stays registry-driven and task-manager-mediated.
- Existing wood, chest, crafting, tool, and cobble workflows remain unchanged in semantics unless explicitly reused through the intent layer.
- The bot must never invent new capabilities or open-ended plans.
- LM Studio ordinary conversational replies remain available where currently supported.

## End-to-End Expectations
- A phrase such as "go get some wood for us" maps to an allowlisted wood workflow and confirms the interpreted action.
- A phrase such as "make me a stone pickaxe" maps to the existing stone-pickaxe crafting capability if valid.
- A phrase such as "go kill mobs for me" is refused safely as unsupported.
- Exact commands still bypass the LLM path entirely.
- Invalid LM Studio payloads fail without crashing the chat loop or task manager.

## Spec Ambiguities
- Wake phrase policy is unspecified. Implementation should allow the router to decide automatically, while preserving exact commands as higher priority than the LLM path.
- Confirmation timing is flexible. Implementation may confirm immediately before execution rather than requiring a separate approval step for low-risk supported actions.
- Default counts may be inherited from existing capability defaults rather than introducing a new global config layer in this run.
