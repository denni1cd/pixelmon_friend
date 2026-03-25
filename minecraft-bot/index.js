const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const collectBlock = require('mineflayer-collectblock').plugin;
const { Vec3 } = require('vec3');
const {
  DEFAULT_WOOD_TARGET,
  WOOD_BLOCK_NAMES,
  WOOD_PLANK_NAMES,
  parseCountCommand,
  planChestResources,
  plankNameForLog
} = require('./wood-utils');

const LM_STUDIO_BASE = 'http://127.0.0.1:1234/v1';
const LM_MODEL = 'qwen_qwen3-30b-a3b-instruct-2507';

const bot = mineflayer.createBot({
  host: '127.0.0.1',
  port: 1055,
  username: 'BotBuddy',
  auth: 'offline',
  version: '1.21.11'
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(collectBlock);

let mcData;
let activeTask = null;

const WOOD_ITEM_NAMES = [...WOOD_BLOCK_NAMES];
const CHEST_BLOCK_NAMES = ['chest', 'trapped_chest'];
const STORAGE_SEARCH_DISTANCE = 16;
const PLACEMENT_SEARCH_DISTANCE = 4;

bot.once('spawn', () => {
  mcData = require('minecraft-data')(bot.version);
  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);

  console.log(`Bot spawned on Minecraft ${bot.version}`);
  bot.chat('Bot online.');
});

bot.on('kicked', (reason) => {
  console.log('Kicked:', reason);
});

bot.on('error', (err) => {
  console.log('Error:', err);
});

function countInventoryItems(names) {
  return bot.inventory.items()
    .filter(item => names.includes(item.name))
    .reduce((sum, item) => sum + item.count, 0);
}

function nearestWoodBlock(maxDistance = 32) {
  return bot.findBlock({
    matching: (block) => block && WOOD_BLOCK_NAMES.includes(block.name),
    maxDistance
  });
}

function nearestNamedBlock(names, maxDistance = STORAGE_SEARCH_DISTANCE) {
  return bot.findBlock({
    matching: (block) => block && names.includes(block.name),
    maxDistance
  });
}

function nearestChestBlock(maxDistance = STORAGE_SEARCH_DISTANCE) {
  return nearestNamedBlock(CHEST_BLOCK_NAMES, maxDistance);
}

function nearestCraftingTable(maxDistance = STORAGE_SEARCH_DISTANCE) {
  return nearestNamedBlock(['crafting_table'], maxDistance);
}

function findInventoryItem(names) {
  return bot.inventory.items().find(item => names.includes(item.name)) || null;
}

function blockIsAir(block) {
  return !block || block.boundingBox === 'empty';
}

function isSolidBlock(block) {
  return !!block && block.boundingBox === 'block';
}

async function goNearBlock(block, radius = 2) {
  await bot.pathfinder.goto(new goals.GoalNear(
    block.position.x,
    block.position.y,
    block.position.z,
    radius
  ));
}

function findPlacementLocation(maxDistance = PLACEMENT_SEARCH_DISTANCE) {
  const origin = bot.entity.position.floored();

  for (let radius = 1; radius <= maxDistance; radius += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        for (let dz = -radius; dz <= radius; dz += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;

          const targetPos = origin.offset(dx, dy, dz);
          const targetBlock = bot.blockAt(targetPos);
          const aboveBlock = bot.blockAt(targetPos.offset(0, 1, 0));
          const referenceBlock = bot.blockAt(targetPos.offset(0, -1, 0));

          if (!blockIsAir(targetBlock) || !blockIsAir(aboveBlock)) continue;
          if (!isSolidBlock(referenceBlock)) continue;

          return {
            targetPos,
            referenceBlock,
            faceVector: new Vec3(0, 1, 0)
          };
        }
      }
    }
  }

  return null;
}

function itemIdByName(name) {
  return mcData?.itemsByName?.[name]?.id ?? bot.registry.itemsByName[name]?.id ?? null;
}

async function craftItemByName(itemName, count = 1, craftingTableBlock = null) {
  const itemId = itemIdByName(itemName);
  if (!itemId) {
    throw new Error(`I don't know how to make ${itemName}.`);
  }

  if (craftingTableBlock) {
    await goNearBlock(craftingTableBlock, 3);
  }

  const recipe = bot.recipesFor(itemId, null, 1, craftingTableBlock)[0];
  if (!recipe) {
    throw new Error(`I don't have the materials to craft ${itemName}.`);
  }

  await bot.craft(recipe, count, craftingTableBlock);
}

async function ensurePlanks(minPlanks) {
  let missingPlanks = minPlanks - countInventoryItems(WOOD_PLANK_NAMES);
  if (missingPlanks <= 0) return;

  const logStacks = bot.inventory.items().filter(item => WOOD_BLOCK_NAMES.includes(item.name));

  for (const stack of logStacks) {
    const plankName = plankNameForLog(stack.name);
    if (!plankName) continue;

    const plankId = itemIdByName(plankName);
    if (!plankId) continue;

    const recipe = bot.recipesFor(plankId, null, 1, null)[0];
    if (!recipe) continue;

    const craftsNeeded = Math.min(stack.count, Math.ceil(missingPlanks / 4));
    await bot.craft(recipe, craftsNeeded, null);

    missingPlanks = minPlanks - countInventoryItems(WOOD_PLANK_NAMES);
    if (missingPlanks <= 0) {
      return;
    }
  }

  throw new Error(`I need ${missingPlanks} more planks to make storage.`);
}

async function placeInventoryBlock(itemName) {
  const item = findInventoryItem([itemName]);
  if (!item) {
    throw new Error(`I don't have a ${itemName} to place.`);
  }

  const placement = findPlacementLocation();
  if (!placement) {
    throw new Error(`I couldn't find a spot to place a ${itemName}.`);
  }

  await bot.pathfinder.goto(new goals.GoalPlaceBlock(placement.targetPos, bot.world, {
    range: 4
  }));

  await bot.equip(item, 'hand');
  await bot.lookAt(placement.targetPos.offset(0.5, 0.5, 0.5), true);
  await bot.placeBlock(placement.referenceBlock, placement.faceVector);

  const placedBlock = bot.blockAt(placement.targetPos);
  if (!placedBlock) {
    throw new Error(`I placed the ${itemName}, but I can't find it now.`);
  }

  return placedBlock;
}

async function ensureCraftingTableAccess() {
  const nearbyTable = nearestCraftingTable();
  if (nearbyTable) {
    return nearbyTable;
  }

  if (findInventoryItem(['crafting_table'])) {
    return placeInventoryBlock('crafting_table');
  }

  await ensurePlanks(4);
  await craftItemByName('crafting_table', 1, null);
  return placeInventoryBlock('crafting_table');
}

async function ensureChestStorage() {
  const nearbyChest = nearestChestBlock();
  if (nearbyChest) {
    return nearbyChest;
  }

  if (findInventoryItem(['chest'])) {
    return placeInventoryBlock('chest');
  }

  const craftingTable = await ensureCraftingTableAccess();
  await ensurePlanks(8);
  await craftItemByName('chest', 1, craftingTable);
  return placeInventoryBlock('chest');
}

async function depositItemsInChest(chestBlock, itemNames, targetCount = null) {
  const stacks = bot.inventory.items().filter(item => itemNames.includes(item.name));
  if (stacks.length === 0) {
    throw new Error("I don't have any wood to stash.");
  }

  await goNearBlock(chestBlock, 3);
  const chest = await bot.openContainer(chestBlock);
  let deposited = 0;
  let remaining = targetCount;

  try {
    for (const stack of stacks) {
      const depositCount = remaining === null
        ? stack.count
        : Math.min(stack.count, remaining);

      if (depositCount <= 0) {
        break;
      }

      await chest.deposit(stack.type, stack.metadata, depositCount);
      deposited += depositCount;

      if (remaining !== null) {
        remaining -= depositCount;
      }
    }
  } finally {
    chest.close();
  }

  if (remaining !== null && remaining > 0) {
    throw new Error(`I only had ${deposited} logs ready to stash.`);
  }

  return deposited;
}

async function askLMStudio(userMessage, playerName) {
  const payload = {
    model: LM_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful Minecraft bot. Keep replies brief, natural, and under 25 words.'
      },
      {
        role: 'user',
        content: `${playerName} says: ${userMessage}`
      }
    ]
  };

  const res = await fetch(`${LM_STUDIO_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LM Studio error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response.';
}

async function collectWoodLogs(targetLogs, announceText) {
  const startCount = countInventoryItems(WOOD_ITEM_NAMES);

  if (announceText) {
    bot.chat(announceText);
  }

  while ((countInventoryItems(WOOD_ITEM_NAMES) - startCount) < targetLogs) {
    const logBlock = nearestWoodBlock(32);

    if (!logBlock) {
      const gathered = countInventoryItems(WOOD_ITEM_NAMES) - startCount;
      return { complete: false, gathered };
    }

    await bot.collectBlock.collect(logBlock);
  }

  const gathered = countInventoryItems(WOOD_ITEM_NAMES) - startCount;
  return { complete: true, gathered };
}

async function gatherWood(targetLogs = DEFAULT_WOOD_TARGET) {
  if (activeTask) {
    bot.chat(`Busy with: ${activeTask}`);
    return;
  }

  activeTask = `gathering ${targetLogs} logs`;

  try {
    const result = await collectWoodLogs(targetLogs, `Getting ${targetLogs} logs.`);

    if (!result.complete) {
      bot.chat(`I only found ${result.gathered} logs nearby.`);
      return;
    }

    bot.chat(`Collected ${result.gathered} logs.`);
  } catch (err) {
    console.error(err);
    bot.chat(`Wood run failed: ${err.message}`);
  } finally {
    activeTask = null;
  }
}

async function stashWood(targetLogs = DEFAULT_WOOD_TARGET) {
  if (activeTask) {
    bot.chat(`Busy with: ${activeTask}`);
    return;
  }

  activeTask = `stashing ${targetLogs} logs`;

  try {
    let materialPlan = planChestResources({
      hasNearbyChest: !!nearestChestBlock(),
      hasChestItem: !!findInventoryItem(['chest']),
      hasNearbyCraftingTable: !!nearestCraftingTable(),
      hasCraftingTableItem: !!findInventoryItem(['crafting_table']),
      plankCount: countInventoryItems(WOOD_PLANK_NAMES),
      logCount: countInventoryItems(WOOD_ITEM_NAMES)
    });

    if (materialPlan.extraLogsNeeded > 0) {
      const materialGather = await collectWoodLogs(
        materialPlan.extraLogsNeeded,
        `Getting ${materialPlan.extraLogsNeeded} logs for chest materials.`
      );

      if (!materialGather.complete) {
        bot.chat(
          `I only found ${materialGather.gathered} logs nearby, so I can't make a chest yet.`
        );
        return;
      }

      materialPlan = planChestResources({
        hasNearbyChest: !!nearestChestBlock(),
        hasChestItem: !!findInventoryItem(['chest']),
        hasNearbyCraftingTable: !!nearestCraftingTable(),
        hasCraftingTableItem: !!findInventoryItem(['crafting_table']),
        plankCount: countInventoryItems(WOOD_PLANK_NAMES),
        logCount: countInventoryItems(WOOD_ITEM_NAMES)
      });
    }

    if (materialPlan.extraLogsNeeded > 0) {
      throw new Error(`I need ${materialPlan.extraLogsNeeded} more logs to make a chest.`);
    }

    const chestBlock = await ensureChestStorage();
    const currentLogCount = countInventoryItems(WOOD_ITEM_NAMES);

    if (currentLogCount < targetLogs) {
      const stashGather = await collectWoodLogs(
        targetLogs - currentLogCount,
        `Getting ${targetLogs - currentLogCount} more logs to stash.`
      );

      if (!stashGather.complete) {
        bot.chat(`I only found ${stashGather.gathered} more logs nearby, so I can't stash ${targetLogs} yet.`);
        return;
      }
    }

    const deposited = await depositItemsInChest(chestBlock, WOOD_ITEM_NAMES, targetLogs);

    bot.chat(`Stashed ${deposited} logs.`);
  } catch (err) {
    console.error(err);
    bot.chat(`Stash failed: ${err.message}`);
  } finally {
    activeTask = null;
  }
}

async function dropAllWood() {
  if (activeTask) {
    bot.chat(`Busy with: ${activeTask}`);
    return;
  }

  activeTask = 'dropping wood';

  try {
    const woodStacks = bot.inventory.items().filter(item => WOOD_ITEM_NAMES.includes(item.name));

    if (woodStacks.length === 0) {
      bot.chat("I don't have any wood.");
      return;
    }

    for (const stack of woodStacks) {
      await bot.tossStack(stack);
    }

    bot.chat('Dropped all wood here.');
  } catch (err) {
    console.error(err);
    bot.chat(`Drop failed: ${err.message}`);
  } finally {
    activeTask = null;
  }
}

function inventorySummary() {
  const items = bot.inventory.items();
  if (items.length === 0) return 'Inventory is empty.';

  const summary = items
    .map(item => `${item.name} x${item.count}`)
    .slice(0, 8)
    .join(', ');

  return `Inventory: ${summary}`;
}

bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  const lower = message.toLowerCase().trim();

  try {
    if (lower === 'follow me') {
      const target = bot.players[username]?.entity;
      if (!target) {
        bot.chat("I can't see you.");
        return;
      }
      bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true);
      bot.chat(`Following ${username}.`);
      return;
    }

    if (lower === 'stop') {
      bot.pathfinder.setGoal(null);
      activeTask = null;
      bot.chat('Stopping.');
      return;
    }

    if (lower === 'come here') {
      const target = bot.players[username]?.entity;
      if (!target) {
        bot.chat("I can't find you.");
        return;
      }
      const pos = target.position;
      bot.pathfinder.setGoal(new goals.GoalNear(pos.x, pos.y, pos.z, 1));
      bot.chat('On my way.');
      return;
    }

    if (lower === 'inventory') {
      bot.chat(inventorySummary());
      return;
    }

    const woodCommand = parseCountCommand(lower, 'wood');
    if (woodCommand.matched) {
      if (woodCommand.error) {
        bot.chat(woodCommand.error);
        return;
      }

      await gatherWood(woodCommand.amount);
      return;
    }

    const stashCommand = parseCountCommand(lower, 'stash wood');
    if (stashCommand.matched) {
      if (stashCommand.error) {
        bot.chat(stashCommand.error);
        return;
      }

      await stashWood(stashCommand.amount);
      return;
    }

    if (lower === 'drop wood' || lower === 'pile wood') {
      await dropAllWood();
      return;
    }

    if (lower.startsWith('bot,')) {
      const prompt = message.slice(4).trim();

      if (!prompt) {
        bot.chat('Say something after "bot,".');
        return;
      }

      const reply = await askLMStudio(prompt, username);
      bot.chat(reply);
    }
  } catch (err) {
    console.error(err);
    bot.chat('Something went wrong.');
  }
});
