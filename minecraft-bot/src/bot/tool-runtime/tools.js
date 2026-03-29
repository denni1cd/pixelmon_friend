const { performance } = require('node:perf_hooks');

const {
  DEFAULT_CRAFT_PLANK_TARGET,
  DEFAULT_CRAFT_STICK_TARGET,
  WOOD_BLOCK_NAMES,
  WOOD_ITEM_NAMES
} = require('../resource-utils');
const { createToolFailure, createToolSuccess } = require('./result');

function currentObservation(context) {
  let position = null;
  try {
    position = context.helpers.currentPositionRecord?.() || null;
  } catch (error) {
    position = null;
  }

  return {
    inventorySummary: context.helpers.inventorySummary?.() || null,
    position
  };
}

function toolMetrics(startTime) {
  return {
    durationMs: Math.round(performance.now() - startTime)
  };
}

function classifyFailureMessage(message, fallback = 'TOOL_FAILED') {
  const lower = String(message || '').toLowerCase();
  if (lower.includes('cancel')) {
    return 'TASK_CANCELLED';
  }
  if (lower.includes('path') || lower.includes('reach') || lower.includes('route')) {
    return 'PATH_FAILED';
  }
  if (lower.includes('material') || lower.includes('need ') || lower.includes("don't have")) {
    return 'INSUFFICIENT_MATERIALS';
  }
  if (lower.includes('chest is not set')) {
    return 'NO_CHEST_SAVED';
  }
  if (lower.includes('missing') && lower.includes('chest')) {
    return 'CHEST_MISSING';
  }

  return fallback;
}

async function gatherLogsTool(context, args, runtime = {}) {
  const startedAt = performance.now();
  const result = await context.helpers.collectResources({
    blockNames: WOOD_BLOCK_NAMES,
    itemNames: WOOD_ITEM_NAMES,
    targetCount: args.targetCount,
    maxDistance: args.searchRadius,
    announceText: runtime.silent ? null : `Getting ${args.targetCount} logs.`,
    signal: runtime.signal,
    noun: 'logs'
  });

  if (!result.ok) {
    return createToolFailure('gather_logs', {
      message: result.message,
      errorCode: result.data?.unreachable ? 'PATH_FAILED' : 'NO_LOGS_FOUND',
      retryable: true,
      data: result.data || null,
      observation: currentObservation(context),
      sideEffects: ['movement', 'block_breaking', 'inventory_change'],
      metrics: toolMetrics(startedAt)
    });
  }

  return createToolSuccess('gather_logs', {
    message: result.message,
    data: {
      collected: result.data?.collected ?? 0,
      requested: args.targetCount
    },
    observation: {
      ...currentObservation(context),
      inventoryLogCount: context.helpers.countInventoryItems?.(WOOD_ITEM_NAMES) || 0
    },
    sideEffects: ['movement', 'block_breaking', 'inventory_change'],
    metrics: toolMetrics(startedAt)
  });
}

async function depositItemsTool(context, args, runtime = {}) {
  const startedAt = performance.now();

  try {
    const target = args.target || 'saved';
    let chestBlock = null;
    if (target === 'saved') {
      chestBlock = context.helpers.savedChestBlock();
    } else {
      chestBlock = args.ensureChest
        ? await context.helpers.ensureChestStorage(runtime.signal)
        : context.helpers.nearestChestBlock();
    }

    if (!chestBlock) {
      return createToolFailure('deposit_items', {
        message: target === 'saved' ? 'Chest is not set yet.' : "I can't find a nearby chest.",
        errorCode: target === 'saved' ? 'NO_CHEST_SAVED' : 'NO_CHEST_AVAILABLE',
        retryable: true,
        observation: currentObservation(context),
        sideEffects: [],
        metrics: toolMetrics(startedAt)
      });
    }

    const stacks = context.helpers.resourceStacks(args.mode);
    if (stacks.length === 0) {
      return createToolFailure('deposit_items', {
        message: args.mode === 'wood' ? "I don't have any wood to deposit." : "I don't have anything to deposit.",
        errorCode: 'NOTHING_TO_DEPOSIT',
        retryable: false,
        observation: currentObservation(context),
        sideEffects: [],
        metrics: toolMetrics(startedAt)
      });
    }

    const deposited = await context.helpers.depositItemsInChest(
      chestBlock,
      stacks,
      args.mode === 'wood' ? (args.amount ?? null) : null,
      runtime.signal
    );

    return createToolSuccess('deposit_items', {
      message: args.mode === 'wood'
        ? (target === 'saved'
          ? `Deposited ${deposited} logs into the saved chest.`
          : `Stashed ${deposited} logs.`)
        : `Deposited ${deposited} items.`,
      data: {
        deposited,
        mode: args.mode,
        target
      },
      observation: currentObservation(context),
      sideEffects: ['movement', 'inventory_change', 'container_access'],
      metrics: toolMetrics(startedAt)
    });
  } catch (error) {
    return createToolFailure('deposit_items', {
      message: error.message || 'Deposit failed.',
      errorCode: classifyFailureMessage(error.message, 'CHEST_UNREACHABLE'),
      retryable: true,
      observation: currentObservation(context),
      sideEffects: ['movement', 'inventory_change', 'container_access'],
      metrics: toolMetrics(startedAt)
    });
  }
}

async function inspectInventoryTool(context) {
  return createToolSuccess('inspect_inventory', {
    message: context.helpers.inventorySummary(),
    data: {
      items: context.bot.inventory.items().map((item) => ({
        name: item.name,
        count: item.count
      }))
    },
    observation: currentObservation(context),
    sideEffects: [],
    metrics: { durationMs: 0 }
  });
}

async function inspectStatusTool(context) {
  return createToolSuccess('inspect_status', {
    message: context.helpers.statusSummary(),
    data: {
      state: context.state.getSnapshot?.() || null,
      task: context.tasks.getStatus?.() || null
    },
    observation: currentObservation(context),
    sideEffects: [],
    metrics: { durationMs: 0 }
  });
}

async function inspectChestStockTool(context, args, runtime = {}) {
  const startedAt = performance.now();

  try {
    const stock = await context.helpers.inspectSavedChestWoodStock(args.minimumChestWood, runtime.signal);
    return createToolSuccess('inspect_chest_stock', {
      message: context.helpers.woodStockStatusMessage(stock),
      data: { stock },
      observation: {
        ...currentObservation(context),
        chestPosition: stock.chestPosition
      },
      sideEffects: ['container_access'],
      metrics: toolMetrics(startedAt)
    });
  } catch (error) {
    return createToolFailure('inspect_chest_stock', {
      message: error.message || 'Could not inspect chest stock.',
      errorCode: classifyFailureMessage(error.message, 'CHEST_UNREACHABLE'),
      retryable: false,
      observation: currentObservation(context),
      sideEffects: ['container_access'],
      metrics: toolMetrics(startedAt)
    });
  }
}

async function goHomeTool(context, _args, runtime = {}) {
  const startedAt = performance.now();

  try {
    const home = context.helpers.savedHomePosition();
    if (!home) {
      return createToolFailure('go_home', {
        message: 'Home is not set yet.',
        errorCode: 'HOME_NOT_SET',
        retryable: false,
        observation: currentObservation(context),
        sideEffects: [],
        metrics: toolMetrics(startedAt)
      });
    }

    await context.helpers.goToSavedPosition(home, 1, runtime.signal);
    return createToolSuccess('go_home', {
      message: `Back home at ${context.helpers.formatSavedPosition(home)}.`,
      data: { homePosition: home },
      observation: currentObservation(context),
      sideEffects: ['movement'],
      metrics: toolMetrics(startedAt)
    });
  } catch (error) {
    return createToolFailure('go_home', {
      message: error.message || 'Could not go home.',
      errorCode: classifyFailureMessage(error.message, 'PATH_FAILED'),
      retryable: true,
      observation: currentObservation(context),
      sideEffects: ['movement'],
      metrics: toolMetrics(startedAt)
    });
  }
}

async function craftItemTool(context, args, runtime = {}) {
  const startedAt = performance.now();
  const count = args.amount ?? 1;

  try {
    let result = null;
    switch (args.itemName) {
      case 'crafting_table':
        result = await context.helpers.craftCraftingTable(runtime.signal);
        break;
      case 'chest':
        result = await context.helpers.craftChest(runtime.signal);
        break;
      case 'oak_planks':
        result = await context.helpers.craftPlanks(count, runtime.signal);
        break;
      case 'stick':
        result = await context.helpers.craftSticks(count, runtime.signal);
        break;
      case 'wooden_axe':
        result = await context.helpers.craftWoodenAxe(runtime.signal);
        break;
      case 'wooden_pickaxe':
        result = await context.helpers.craftWoodenPickaxe(runtime.signal);
        break;
      case 'stone_axe':
        result = await context.helpers.craftStoneAxe(runtime.signal);
        break;
      case 'stone_pickaxe':
        result = await context.helpers.craftStonePickaxe(runtime.signal);
        break;
      default:
        return createToolFailure('craft_item', {
          message: `Unsupported craft target ${args.itemName}.`,
          errorCode: 'UNSUPPORTED_CRAFT',
          retryable: false,
          observation: currentObservation(context),
          sideEffects: [],
          metrics: toolMetrics(startedAt)
        });
    }

    return createToolSuccess('craft_item', {
      message: `Crafted ${result?.crafted ?? count} ${args.itemName.replaceAll('_', ' ')}.`,
      data: {
        itemName: args.itemName,
        amount: count,
        result: result || null
      },
      observation: currentObservation(context),
      sideEffects: ['inventory_change', 'movement', 'container_access'],
      metrics: toolMetrics(startedAt)
    });
  } catch (error) {
    return createToolFailure('craft_item', {
      message: error.message || 'Craft failed.',
      errorCode: classifyFailureMessage(error.message, 'INSUFFICIENT_MATERIALS'),
      retryable: true,
      observation: currentObservation(context),
      sideEffects: ['inventory_change', 'movement', 'container_access'],
      metrics: toolMetrics(startedAt)
    });
  }
}

async function ensureChestAccessTool(context, args, runtime = {}) {
  const startedAt = performance.now();

  try {
    const existing = context.helpers.nearestChestBlock() || (() => {
      try {
        return context.helpers.savedChestBlock();
      } catch (error) {
        return null;
      }
    })();

    const chestBlock = existing || await context.helpers.ensureChestStorage(runtime.signal);
    const chestPosition = chestBlock?.position
      ? {
        x: chestBlock.position.x,
        y: chestBlock.position.y,
        z: chestBlock.position.z,
        dimension: context.bot.game?.dimension ?? null
      }
      : null;

    if (args.remember && chestPosition) {
      context.state.setChestPosition?.(chestPosition);
    }

    return createToolSuccess('ensure_chest_access', {
      message: args.remember ? 'Chest access ready and remembered.' : 'Chest access ready.',
      data: {
        remembered: !!args.remember,
        chestPosition
      },
      observation: currentObservation(context),
      sideEffects: ['movement', 'inventory_change', 'block_placement'],
      metrics: toolMetrics(startedAt)
    });
  } catch (error) {
    return createToolFailure('ensure_chest_access', {
      message: error.message || 'Could not ensure chest access.',
      errorCode: classifyFailureMessage(error.message, 'INSUFFICIENT_MATERIALS'),
      retryable: true,
      observation: currentObservation(context),
      sideEffects: ['movement', 'inventory_change', 'block_placement'],
      metrics: toolMetrics(startedAt)
    });
  }
}

async function recoverFromStuckTool(context, args) {
  await context.helpers.stopAllActions();
  return createToolSuccess('recover_from_stuck', {
    status: 'recovered',
    message: `Reset movement state after ${args.reason}.`,
    data: { reason: args.reason },
    observation: currentObservation(context),
    sideEffects: ['movement_reset'],
    metrics: { durationMs: 0 }
  });
}

async function craftPlanksTool(context, args, runtime = {}) {
  const startedAt = performance.now();

  try {
    const result = await context.helpers.craftPlanks(args.amount ?? DEFAULT_CRAFT_PLANK_TARGET, runtime.signal);
    return createToolSuccess('craft_planks', {
      message: `Crafted ${result.crafted} planks.`,
      data: result,
      observation: currentObservation(context),
      sideEffects: ['inventory_change'],
      metrics: toolMetrics(startedAt)
    });
  } catch (error) {
    return createToolFailure('craft_planks', {
      message: error.message || 'Could not craft planks.',
      errorCode: classifyFailureMessage(error.message, 'INSUFFICIENT_MATERIALS'),
      retryable: true,
      observation: currentObservation(context),
      sideEffects: ['inventory_change'],
      metrics: toolMetrics(startedAt)
    });
  }
}

async function craftSticksTool(context, args, runtime = {}) {
  const startedAt = performance.now();

  try {
    const result = await context.helpers.craftSticks(args.amount ?? DEFAULT_CRAFT_STICK_TARGET, runtime.signal);
    return createToolSuccess('craft_sticks', {
      message: `Crafted ${result.crafted} sticks.`,
      data: result,
      observation: currentObservation(context),
      sideEffects: ['inventory_change'],
      metrics: toolMetrics(startedAt)
    });
  } catch (error) {
    return createToolFailure('craft_sticks', {
      message: error.message || 'Could not craft sticks.',
      errorCode: classifyFailureMessage(error.message, 'INSUFFICIENT_MATERIALS'),
      retryable: true,
      observation: currentObservation(context),
      sideEffects: ['inventory_change'],
      metrics: toolMetrics(startedAt)
    });
  }
}

const TOOL_HANDLERS = {
  craft_item: craftItemTool,
  craft_planks: craftPlanksTool,
  craft_sticks: craftSticksTool,
  deposit_items: depositItemsTool,
  ensure_chest_access: ensureChestAccessTool,
  gather_logs: gatherLogsTool,
  go_home: goHomeTool,
  inspect_chest_stock: inspectChestStockTool,
  inspect_inventory: inspectInventoryTool,
  inspect_status: inspectStatusTool,
  recover_from_stuck: recoverFromStuckTool
};

module.exports = {
  TOOL_HANDLERS
};
