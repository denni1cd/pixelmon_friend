const test = require('node:test');
const assert = require('node:assert/strict');

const { createRuntimeState } = require('../src/bot/state');
const { TaskManager } = require('../src/bot/task-manager');
const { createToolRuntime } = require('../src/bot/tool-runtime');
const { TOOL_ERROR_CODES } = require('../src/bot/tool-runtime/error-codes');

function position(x = 0, y = 64, z = 0) {
  return {
    x,
    y,
    z,
    floored() {
      return this;
    }
  };
}

function createContext(overrides = {}) {
  const state = overrides.state || createRuntimeState();
  const bot = overrides.bot || {
    entity: { position: position(10, 64, -3) },
    game: { dimension: 'overworld' },
    inventory: {
      items() {
        return [
          { name: 'oak_log', count: 8, type: 1, metadata: 0 },
          { name: 'stick', count: 4, type: 2, metadata: 0 }
        ];
      }
    }
  };

  const chestBlock = {
    name: 'chest',
    position: position(2, 64, 2)
  };

  let stockCalls = 0;
  const helpers = {
    ensureReady() {},
    inventorySummary() {
      return 'Inventory: oak_log x8, stick x4';
    },
    statusSummary() {
      return 'Status: idle.';
    },
    countInventoryItems() {
      return 8;
    },
    async collectResources({ targetCount }) {
      return {
        ok: true,
        message: `Collected ${targetCount} logs.`,
        data: {
          collected: targetCount,
          complete: true
        }
      };
    },
    nearestChestBlock() {
      return chestBlock;
    },
    savedChestBlock() {
      return chestBlock;
    },
    async ensureChestStorage() {
      return chestBlock;
    },
    resourceStacks() {
      return [
        { name: 'oak_log', count: 8, type: 1, metadata: 0 }
      ];
    },
    async depositItemsInChest(_block, _stacks, targetCount = null) {
      return targetCount ?? 8;
    },
    async inspectSavedChestWoodStock(minimumChestWood = 20) {
      stockCalls += 1;
      if (stockCalls === 1) {
        return {
          count: 12,
          target: minimumChestWood,
          deficit: minimumChestWood - 12,
          needsRefill: true,
          chestPosition: { x: 2, y: 64, z: 2 }
        };
      }

      return {
        count: minimumChestWood,
        target: minimumChestWood,
        deficit: 0,
        needsRefill: false,
        chestPosition: { x: 2, y: 64, z: 2 }
      };
    },
    woodStockStatusMessage(stock) {
      return `Wood stock ${stock.count}/${stock.target}.`;
    },
    savedHomePosition() {
      return { x: 0, y: 64, z: 0, dimension: 'overworld' };
    },
    async goToSavedPosition() {},
    formatSavedPosition(savedPosition) {
      return `${savedPosition.x} ${savedPosition.y} ${savedPosition.z}`;
    },
    async craftPlanks(amount) {
      return { crafted: amount, total: amount };
    },
    async craftSticks(amount) {
      return { crafted: amount, total: amount };
    },
    async craftCraftingTable() {
      return { crafted: 1, total: 1 };
    },
    async craftChest() {
      return { crafted: 1, total: 1 };
    },
    async craftWoodenAxe() {
      return { crafted: 1, total: 1 };
    },
    async craftWoodenPickaxe() {
      return { crafted: 1, total: 1 };
    },
    async craftStoneAxe() {
      return { crafted: 1, total: 1 };
    },
    async craftStonePickaxe() {
      return { crafted: 1, total: 1 };
    },
    async stopAllActions() {}
  };

  const context = {
    bot,
    mcData: {},
    state,
    logger: {
      info() {},
      warn() {},
      error() {}
    },
    helpers,
    tasks: overrides.tasks || new TaskManager({ state }),
    say() {}
  };

  return {
    context: {
      ...context,
      ...(overrides.context || {}),
      helpers: {
        ...helpers,
        ...(overrides.helpers || {})
      }
    },
    chestBlock
  };
}

test('tool runtime returns normalized result envelopes for approved tools', async () => {
  const { context } = createContext();
  const runtime = createToolRuntime(context);

  const result = await runtime.executeTool({
    toolName: 'inspect_inventory',
    args: {},
    source: 'test'
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 'completed');
  assert.equal(result.toolName, 'inspect_inventory');
  assert.equal(result.message, 'Inventory: oak_log x8, stick x4');
  assert.ok(Array.isArray(result.sideEffects));
  assert.equal(typeof result.metrics.durationMs, 'number');
});

test('policy gate rejects invalid arguments and busy runtime execution', async () => {
  const { context } = createContext();
  const runtime = createToolRuntime(context);

  const invalid = runtime.policyGate.validateRequest({
    toolName: 'gather_logs',
    args: { targetCount: 'many' }
  });

  assert.equal(invalid.allowed, false);
  assert.equal(invalid.failureCode, TOOL_ERROR_CODES.INVALID_TOOL_ARGS);

  let release;
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  const firstTask = context.tasks.run('busy task', async () => {
    await hold;
    return { ok: true, message: 'done' };
  });

  const busy = await runtime.executeTool({
    toolName: 'gather_logs',
    args: { targetCount: 4 },
    source: 'test'
  });

  assert.equal(busy.ok, false);
  assert.equal(busy.errorCode, TOOL_ERROR_CODES.RUNTIME_BUSY);

  release();
  await firstTask;
});

test('objective planner runs bounded maintain-wood workflow through approved tools only', async () => {
  const { context } = createContext();
  const runtime = createToolRuntime(context);

  const result = await runtime.executeObjective({
    goalType: 'maintain_wood_stock',
    goal: 'maintain_wood_stock',
    constraints: {
      maxSteps: 8,
      allowTools: [
        'inspect_chest_stock',
        'ensure_chest_access',
        'gather_logs',
        'deposit_items',
        'recover_from_stuck'
      ]
    },
    context: {
      targetWoodStock: 20
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 'completed');
  assert.match(result.message, /(Wood maintenance complete|Wood stock okay)/);

  const history = context.state.getObjectiveState().recentToolHistory.map((entry) => entry.toolName);
  assert.ok(history.includes('inspect_chest_stock'));
  assert.ok(history.includes('gather_logs'));
  assert.ok(history.includes('deposit_items'));
});

test('recovery path uses ensure_chest_access when chest inspection starts blocked', async () => {
  const { context } = createContext({
    helpers: {
      savedChestBlock() {
        throw new Error('Chest is not set yet.');
      },
      async inspectSavedChestWoodStock() {
        throw new Error('Chest is not set yet.');
      }
    }
  });
  const runtime = createToolRuntime(context);

  const result = await runtime.executeObjective({
    goalType: 'maintain_wood_stock',
    goal: 'maintain_wood_stock',
    constraints: {
      maxSteps: 4,
      allowTools: [
        'inspect_chest_stock',
        'ensure_chest_access',
        'recover_from_stuck'
      ]
    },
    context: {
      targetWoodStock: 20
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, 'OBJECTIVE_BLOCKED');

  const history = context.state.getObjectiveState().recentToolHistory.map((entry) => entry.toolName);
  assert.ok(history.includes('ensure_chest_access'));
});

test('mcp adapter lists tools and calls through the shared runtime contracts', async () => {
  const { context } = createContext();
  const runtime = createToolRuntime(context);

  const listResponse = await runtime.mcpAdapter.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  });
  const callResponse = await runtime.mcpAdapter.handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'inspect_inventory',
      arguments: {}
    }
  });

  assert.equal(listResponse.result.tools.some((tool) => tool.name === 'inspect_inventory'), true);
  assert.equal(callResponse.result.isError, false);
  assert.equal(callResponse.result.structuredContent.toolName, 'inspect_inventory');
  assert.equal(callResponse.result.structuredContent.message, 'Inventory: oak_log x8, stick x4');
});
