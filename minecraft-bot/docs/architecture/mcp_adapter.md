# MCP Adapter

## Surface
The MCP layer is an adapter over the internal tool runtime, not a parallel execution path.

## Files
- `src/bot/tool-runtime/mcp-adapter.js`
- `src/mcp/server.js`

## Supported Methods
- `initialize`
- `tools/list`
- `tools/call`

## Behavior
- `tools/list` reflects the internal registry snapshot.
- `tools/call` executes through the same policy gate and task mediation as internal callers.
- Responses include structured tool results so external callers see the same normalized envelopes as internal runtime users.

## Transport
`npm run mcp` starts a thin stdio JSON-RPC wrapper that forwards `initialize`, `tools/list`, and `tools/call` to the shared adapter.
