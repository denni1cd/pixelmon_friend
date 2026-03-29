# Minecraft Bot

Mineflayer-based Minecraft bot with two operator surfaces:

- in-game chat commands and bounded LM-assisted intent routing
- a structured tool runtime exposed through an MCP-compatible adapter

The recent refactor moved the project away from "capabilities as the architecture" and toward a layered runtime where chat, maintenance loops, planner objectives, and MCP calls all converge on the same approved tool system.

## What This Repo Does

The bot can currently handle a focused set of survival helper tasks around:

- gathering wood and stone
- crafting core starter items and tools
- depositing resources into chests
- remembering home and chest locations
- reporting inventory and runtime status
- maintaining a minimum wood stock in a remembered chest

It is intentionally bounded. The model layer does not get direct access to raw Mineflayer APIs.

## New Structure

The repo now has a clearer split between the legacy command surface and the new shared runtime:

- `index.js`
  Starts the normal Mineflayer bot process.
- `src/bot/app.js`
  App bootstrap. Creates the bot, shared context, task manager, helpers, LM Studio client, tool runtime, and maintenance loop.
- `src/bot/`
  Core runtime modules.
- `src/bot/capabilities/`
  Legacy command-oriented capabilities. Many still exist for compatibility, but migrated commands now route through the tool runtime first.
- `src/bot/tool-runtime/`
  The new architecture center.
- `src/mcp/server.js`
  Thin stdio JSON-RPC wrapper over the shared MCP adapter.
- `docs/architecture/`
  Focused architecture notes for the tool runtime, planner loop, recovery policy, and MCP adapter.
- `specs/`
  Phase-by-phase implementation specs and refactor notes.
- `test/`
  Node test suite covering command parsing, chat routing, task execution, tool runtime behavior, recovery, and MCP adapter behavior.

## Architecture Overview

### 1. Runtime Layer

`src/bot/app.js` creates the Mineflayer bot and the shared runtime context:

- Mineflayer bot connection
- pathfinder and collectblock plugins
- helpers for movement, crafting, storage, and resource collection
- shared state and task management
- LM Studio client
- tool runtime

### 2. Tool Runtime Layer

The tool runtime is the new planner-safe execution surface:

- `src/bot/tool-runtime/tool-definitions.js`
  Declares approved tools, input schemas, categories, preconditions, retry hints, and error codes.
- `src/bot/tool-runtime/tools.js`
  Implements the tool handlers.
- `src/bot/tool-runtime/policy.js`
  Validates requests before execution.
- `src/bot/tool-runtime/index.js`
  Wires registry, validation, task mediation, legacy command bridging, objective execution, and MCP exposure together.

Every tool returns a normalized result envelope with fields such as:

- `ok`
- `status`
- `toolName`
- `message`
- `data`
- `observation`
- `errorCode`
- `retryable`
- `sideEffects`
- `metrics`

### 3. Objective / Planner Layer

The current bounded objective runner is in `src/bot/tool-runtime/objective-runner.js`.

Right now the main objective path is wood-stock maintenance:

1. inspect chest stock
2. gather missing logs
3. deposit wood
4. re-check stock

Recovery stays deterministic through the recovery policy instead of asking the model to improvise.

### 4. Chat and Intent Layer

Players can still control the bot through chat:

- exact commands are parsed first
- only if no exact command matches, LM Studio classifies the message as task / conversation / unsupported
- approved task intents are routed back into the same shared runtime

This means chat is now one front end to the runtime, not a separate execution architecture.

### 5. MCP Adapter Layer

The MCP-facing layer is an adapter over the internal tool runtime:

- `src/bot/tool-runtime/mcp-adapter.js`
- `src/mcp/server.js`

It does not expose raw helpers or bypass validation. MCP calls go through the same tool registry, policy gate, and task mediation as internal callers.

## Current Tool Surface

The current approved MCP/runtime tools are:

- `gather_logs`
- `deposit_items`
- `inspect_inventory`
- `inspect_status`
- `inspect_chest_stock`
- `go_home`
- `craft_item`
- `ensure_chest_access`
- `recover_from_stuck`
- `maintain_wood_stock`
- `craft_planks`
- `craft_sticks`

The authoritative definitions live in [src/bot/tool-runtime/tool-definitions.js](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\src\bot\tool-runtime\tool-definitions.js).

## Requirements

- Node.js 20+ recommended
  This repo relies on built-in `fetch` and `AbortSignal.timeout`.
- A running Minecraft server reachable by the bot
- LM Studio running locally if you want natural-language intent routing or chat replies

## Configuration

The current runtime configuration is hardcoded in [src/bot/constants.js](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\src\bot\constants.js):

- Minecraft host: `127.0.0.1`
- Minecraft port: `1055`
- Bot username: `BotBuddy`
- Auth mode: `offline`
- Minecraft version: `1.21.11`
- LM Studio base URL: `http://127.0.0.1:1234/v1`
- LM Studio model: `qwen_qwen3-30b-a3b-instruct-2507`

If you need different host, port, username, version, or local model settings, update that file first.

## Install

```bash
npm install
```

## Run The Bot

Start the normal bot process with:

```bash
node index.js
```

That entrypoint creates the Mineflayer bot immediately and connects using the settings in `src/bot/constants.js`.

## Chat Commands

Exact commands still work and are the safest operator interface. Examples:

- `wood 16`
- `stone 16`
- `wood run 16`
- `stash wood 16`
- `deposit all`
- `deposit wood`
- `set home`
- `set chest`
- `go home`
- `where is home`
- `where is chest`
- `status`
- `inventory`
- `craft planks 8`
- `craft sticks 8`
- `craft chest`
- `craft wooden axe`
- `craft stone pickaxe`
- `enable wood maintenance`
- `disable wood maintenance`
- `maintain wood 64`
- `stop`

The parser lives in [src/bot/command-parser.js](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\src\bot\command-parser.js).

## MCP Server Setup

### Important Transport Note

This repo currently implements an MCP-compatible method surface over a lightweight stdio wrapper, but the transport is newline-delimited JSON-RPC over stdin/stdout.

It is not using the header-framed stdio transport from the official MCP SDKs.

That means:

- custom clients and test harnesses can talk to it directly
- a stock MCP host may need a small shim or a transport rewrite before it can use this server as-is

### What `npm run mcp` Does

```bash
npm run mcp
```

This runs:

```bash
node src/mcp/server.js
```

That process:

- creates the same shared bot app used by `index.js`
- boots the Mineflayer bot immediately
- reads one JSON request per input line
- writes one JSON response per output line

### Startup Requirement

Because the MCP server creates the bot app on startup, your Minecraft server should already be available at the configured host and port.

If it is not, the process will still start responding to some MCP requests, but you will see Mineflayer connection errors and tool execution that depends on world access will fail.

### Supported MCP Methods

The current server handles:

- `initialize`
- `tools/list`
- `tools/call`

Those are implemented in [src/bot/tool-runtime/mcp-adapter.js](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\src\bot\tool-runtime\mcp-adapter.js).

### Example MCP Session

Send newline-delimited JSON objects to stdin.

Example initialize request:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize"}
```

Example tools list request:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
```

Example tool call:

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"inspect_inventory","arguments":{}}}
```

The response shape for `tools/call` includes:

- `content`
- `structuredContent`
- `isError`

`structuredContent` is the normalized internal tool result envelope.

### Quick PowerShell Smoke Test

From the repo root:

```powershell
@'
{"jsonrpc":"2.0","id":1,"method":"initialize"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
'@ | node src/mcp/server.js
```

### Integration Guidance

If you want to use this with a full MCP host:

1. keep `src/bot/tool-runtime/mcp-adapter.js` as the source of truth
2. replace or wrap `src/mcp/server.js` with a proper MCP SDK transport
3. preserve the adapter-only design so MCP remains a thin layer over the existing runtime

Do not expose raw Mineflayer helpers directly through MCP.

## Tests

Run the full test suite with:

```bash
npm test
```

The current suite covers:

- command parsing
- chat routing
- capability behavior
- task manager behavior
- tool runtime contracts
- objective execution and recovery
- MCP adapter behavior

## Useful Docs

- [docs/architecture/tool_runtime.md](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\docs\architecture\tool_runtime.md)
- [docs/architecture/planner_loop.md](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\docs\architecture\planner_loop.md)
- [docs/architecture/recovery_policy.md](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\docs\architecture\recovery_policy.md)
- [docs/architecture/mcp_adapter.md](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\docs\architecture\mcp_adapter.md)
- [pixelmon_pal_mcp_architecture_spec.md](C:\Users\Zero\python_projects\ai\pixelmon_friend\minecraft-bot\docs\specs\archive\pixelmon_pal_mcp_architecture_spec.md)

## Development Notes

- The repo is in a transition state where legacy capabilities still exist, but migrated paths should go through the tool runtime.
- The wood-maintenance timer in `src/bot/app.js` now uses the bounded objective runtime instead of calling ad hoc logic directly.
- MCP is intentionally thin. The important logic lives below it in the shared runtime.
