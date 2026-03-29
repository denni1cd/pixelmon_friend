const readline = require('node:readline');

const { createBotApp } = require('../bot/app');

async function main() {
  const { context } = createBotApp();
  const adapter = context.toolRuntime?.mcpAdapter;

  if (!adapter?.handleRequest) {
    throw new Error('MCP adapter is not available.');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let request;
    try {
      request = JSON.parse(trimmed);
    } catch (error) {
      process.stdout.write(`${JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        }
      })}\n`);
      continue;
    }

    const response = await adapter.handleRequest(request);
    process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message || String(error)}\n`);
  process.exitCode = 1;
});
