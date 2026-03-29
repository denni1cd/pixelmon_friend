# Task 1 Notes

- Expanded runtime state with task snapshot, failure/outcome memory, crafting-table memory, and preferred tools.
- Reworked `TaskManager` to centralize busy checks, failure capture, cancellation cleanup, and lifecycle logging.
- Kept the modular capability surface intact; no registry rewrite.
