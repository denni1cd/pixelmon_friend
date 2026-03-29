# Milestone 3 Plan

Objective: expose the approved tools through MCP and rewire runtime entrypoints onto the new tool system.

Scope:
- MCP-compatible adapter
- thin stdio wrapper
- chat-runtime and maintenance-loop rewiring
- regression coverage

Verification:
- MCP can list tools and call tools through the shared runtime
- `npm run mcp` starts the adapter wrapper
