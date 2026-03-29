# Risk Notes

- The repo already contained in-progress `tool-runtime` files. Integration deliberately converged on a single exposed runtime factory instead of creating a second parallel architecture.
- Direct capability tests were preserved by keeping capability fallbacks when `toolRuntime` is absent.
- Objective planning is deterministic-first. That keeps boundedness high, but richer LM-guided planning remains future work.
- The MCP server is intentionally thin and adapter-focused; richer transport framing can evolve without changing the internal tool contracts.
