## Technomancy execution contract

### Scope for this run
This is a small single-feature change.
Use:
- 1 Arch Technomancer
- 1 High Technomancer
- up to 2 Technomancers

Do not create additional High Technomancers unless a blocker forces the milestone to split.

### Required execution order
1. Arch Technomancer reads the spec and current `index.js`.
2. Arch Technomancer produces:
   - `docs/technomancy/runs/<run_id>/project_plan.md`
   - `docs/technomancy/runs/<run_id>/delegation_matrix.json`
   - `docs/technomancy/runs/<run_id>/risk_notes.md`
3. High Technomancer owns the single milestone and produces:
   - `docs/technomancy/runs/<run_id>/milestone_1/tactical_plan.md`
   - `docs/technomancy/runs/<run_id>/milestone_1/contracts.md`
   - `docs/technomancy/runs/<run_id>/milestone_1/task_graph.json`
   - `docs/technomancy/runs/<run_id>/milestone_1/verification_checklist.md`
4. Only after those artifacts exist may Technomancers begin implementation.
5. Technomancers perform code changes and produce:
   - `docs/technomancy/runs/<run_id>/milestone_1/task_<id>_notes.md`
   - `docs/technomancy/runs/<run_id>/milestone_1/task_<id>_verification.md`

### Communication rules
- Arch communicates with High through run artifacts.
- Technomancers may communicate only within their milestone artifact area.
- No direct cross-team lateral communication.
- Any contract change must be written to `contracts.md` before implementation continues.

### Parallelism rules
The High Technomancer may run Technomancers in parallel only when tasks are independent.
For this feature, parallelism should normally be limited to:
- one task for chest discovery / chest crafting / chest placement flow
- one task for command wiring / deposit behavior / error handling

### Required implementation constraints
- Preserve existing commands unless explicitly changed by this spec.
- Reuse existing helpers and patterns where possible.
- Prefer adding focused helper functions over rewriting the file.
- Do not introduce a database, memory layer, or unrelated framework changes.

### Required verification
Before completion, verify:
- `stash wood` gathers wood and stores it
- `stash wood <n>` gathers the requested amount and stores it
- existing wood-related commands still work
- if a chest exists nearby, the bot uses it
- if no chest exists, the bot crafts and places one if materials allow
- if materials do not allow crafting a chest, the bot fails cleanly with a clear message

### Completion criteria
The run is not complete until:
- code changes are written
- verification notes are written
- the High Technomancer signs off milestone completion
- the Arch Technomancer writes a final summary