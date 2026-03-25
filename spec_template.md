# [Project / Feature Name]

## 1. Objective
Describe the feature or change in plain language.

### Summary
[What should be built?]

### Business / user goal
[Why does this matter?]

### Definition of success
[What must be true for this to be considered successful?]

## 2. Current state
Describe the current system behavior and relevant baseline.

### Existing behavior
[What does the system do today?]

### Relevant files / components
- `[file/path/one]`
- `[file/path/two]`

### Existing constraints
[Technical, architectural, environmental, or package constraints]

## 3. Requested change
Describe exactly what needs to change.

### New behavior
[What should happen after the change?]

### User-facing commands / inputs
[Commands, API inputs, UI actions, triggers]

### Expected outputs
[What should the system return, display, create, or modify?]

## 4. Scope
Clarify boundaries so Technomancy does not invent extra work.

### In scope
- [Item]
- [Item]
- [Item]

### Out of scope
- [Item]
- [Item]
- [Item]

### Future scope
- [Item]
- [Item]

## 5. Functional requirements
List the required behaviors.

### Requirement 1
[Description]

### Requirement 2
[Description]

### Requirement 3
[Description]

### Requirement 4
[Description]

## 6. Technical requirements
Document implementation expectations.

### Language / framework
[Example: Node.js with mineflayer]

### Required libraries
- [Library]
- [Library]

### Required patterns to preserve
- [Existing helper pattern]
- [Existing lock / task system]
- [Existing config or startup flow]

### Forbidden changes
- [Do not rewrite entire file]
- [Do not change unrelated commands]
- [Do not add new framework]

## 7. Data and contracts
Define any important interfaces.

### Inputs
[Input shape, parameters, chat commands, payload format]

### Outputs
[Output shape, side effects, files created, messages sent]

### Internal contracts
[Important function signatures, state transitions, file contracts, schemas]

## 8. Error handling
Describe how failure must work.

### Failure cases
- [Case]
- [Case]
- [Case]

### Required failure behavior
[What should be logged, reported, retried, or aborted?]

### Recovery rules
[What should happen after failure?]

## 9. Acceptance criteria
These are the concrete conditions for completion.

### Scenario 1
**Given:** [state]  
**When:** [action]  
**Then:** [expected result]

### Scenario 2
**Given:** [state]  
**When:** [action]  
**Then:** [expected result]

### Scenario 3
**Given:** [state]  
**When:** [action]  
**Then:** [expected result]

## 10. Verification requirements
Explain how the implementation should be checked.

### Manual verification
- [Check]
- [Check]
- [Check]

### Automated verification
- [Unit test]
- [Integration test]
- [Smoke test]

### Regression requirements
[What existing behavior must still work?]

## 11. Technomancy execution contract

### Run classification
[small / medium / large]

### Agent structure
- Arch Technomancer: 1
- High Technomancer: [count]
- Technomancers per High: [count or max]

### Parallelism rules
[Which milestones or tasks may run in parallel?]
[Which must remain sequential?]

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
- [Assumption]
- [Assumption]

### Risks
- [Risk]
- [Risk]

### Open questions
- [Question]
- [Question]

## 13. Final notes for Codex
Use this section for direct implementation instructions.

[Example: preserve existing commands]
[Example: prefer helper functions over rewrites]
[Example: keep changes localized to index.js]
[Example: do not add new dependencies unless required]