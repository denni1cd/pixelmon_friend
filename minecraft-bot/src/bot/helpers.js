const { goals } = require('mineflayer-pathfinder');

const {
  DEFAULT_WOOD_STOCK_TARGET,
  PLACEMENT_SEARCH_DISTANCE,
  RESOURCE_CANDIDATE_COUNT,
  RESOURCE_SEARCH_DISTANCE,
  STORAGE_SEARCH_DISTANCE
} = require('./constants');
const {
  AXE_TOOL_NAMES,
  bestToolNameForItems,
  CHEST_BLOCK_NAMES,
  COBBLE_ITEM_NAMES,
  COBBLE_SOURCE_BLOCK_NAMES,
  craftsNeededForOutput,
  DEPOSIT_RESOURCE_NAMES,
  DEFAULT_CRAFT_STICK_TARGET,
  PICKAXE_TOOL_NAMES,
  planksNeededForStickCount,
  SCAFFOLD_BLOCK_NAMES,
  SCAFFOLD_ITEM_NAMES,
  isEquipmentItemName,
  WOOD_ITEM_NAMES,
  WOOD_PLANK_NAMES,
  planChestResources,
  plankNameForLog
} = require('./resource-utils');

function createHelpers(context) {
  const { bot } = context;

  function currentDimension() {
    return bot.game?.dimension ?? null;
  }

  function normalizeDimensionedPosition(position) {
    const formatted = formatCoordinates(position);
    return {
      x: Number.parseInt(formatted.split(' ')[0], 10),
      y: Number.parseInt(formatted.split(' ')[1], 10),
      z: Number.parseInt(formatted.split(' ')[2], 10),
      dimension: position.dimension ?? currentDimension()
    };
  }

  function countInventoryItems(names) {
    return bot.inventory.items()
      .filter((item) => names.includes(item.name))
      .reduce((sum, item) => sum + item.count, 0);
  }

  function countInventoryItem(name) {
    return countInventoryItems([name]);
  }

  function inventoryItemNames() {
    return bot.inventory.items().map((item) => item.name);
  }

  function findInventoryItem(names) {
    return bot.inventory.items().find((item) => names.includes(item.name)) || null;
  }

  function findNearestNamedBlock(names, maxDistance = STORAGE_SEARCH_DISTANCE) {
    return bot.findBlock({
      matching: (block) => block && names.includes(block.name),
      maxDistance
    });
  }

  function nearestChestBlock(maxDistance = STORAGE_SEARCH_DISTANCE) {
    return findNearestNamedBlock(CHEST_BLOCK_NAMES, maxDistance);
  }

  function nearestCraftingTable(maxDistance = STORAGE_SEARCH_DISTANCE) {
    return findNearestNamedBlock(['crafting_table'], maxDistance);
  }

  function inventorySummary(limit = 8) {
    const items = bot.inventory.items();
    if (items.length === 0) {
      return 'Inventory is empty.';
    }

    const summary = items
      .map((item) => `${item.name} x${item.count}`)
      .slice(0, limit)
      .join(', ');

    return `Inventory: ${summary}`;
  }

  function formatCoordinates(position) {
    if (!position) {
      return 'unknown';
    }

    const floored = position.floored ? position.floored() : position;
    return `${floored.x} ${floored.y} ${floored.z}`;
  }

  function formatSavedPosition(position) {
    if (!position) {
      return 'unset';
    }

    const coordinates = formatCoordinates(position);
    return position.dimension ? `${coordinates} (${position.dimension})` : coordinates;
  }

  function failureSummary() {
    const failure = context.state.getLastFailure?.();
    if (!failure) {
      return 'none';
    }

    const message = String(failure.message || '').replace(/[.?!]+$/, '');
    return `${failure.taskName}: ${message}`;
  }

  function statusSummary() {
    const snapshot = context.state.getSnapshot?.() || {};
    const status = snapshot.taskStatus || context.tasks.getStatus();
    const taskPart = status.taskName ? `${status.state} ${status.taskName}` : 'idle';
    const positionPart = formatCoordinates(bot.entity?.position);
    const homePart = formatSavedPosition(snapshot.homePosition);
    const chestPart = formatSavedPosition(snapshot.chestPosition);
    const tablePart = formatSavedPosition(snapshot.craftingTablePosition);
    const axePart = snapshot.preferredTools?.axe ? toolDisplayName(snapshot.preferredTools.axe) : 'unset';
    const pickaxePart = snapshot.preferredTools?.pickaxe ? toolDisplayName(snapshot.preferredTools.pickaxe) : 'unset';
    const woodMaintenance = snapshot.woodMaintenance || {};
    const maintenancePart = woodMaintenance.enabled
      ? `Wood maintenance on ${woodMaintenance.minimumChestWood}.`
      : `Wood maintenance off ${woodMaintenance.minimumChestWood ?? DEFAULT_WOOD_STOCK_TARGET}.`;
    return `Status: ${taskPart}. Pos ${positionPart}. Home ${homePart}. Chest ${chestPart}. Table ${tablePart}. Axe ${axePart}. Pickaxe ${pickaxePart}. ${maintenancePart} Last failure: ${failureSummary()}.`;
  }

  function ensureReady() {
    if (!context.mcData) {
      throw new Error('Still spawning. Try again in a moment.');
    }
  }

  function throwIfAborted(signal) {
    if (signal?.aborted) {
      throw new Error('Task cancelled.');
    }
  }

  function positionKey(position) {
    return `${position.x},${position.y},${position.z}`;
  }

  function currentEntityPosition() {
    return bot.entity?.position ?? null;
  }

  function blockTravelScore(block) {
    const current = currentEntityPosition();
    if (!current || !block?.position) {
      return 0;
    }

    const dx = Math.abs(block.position.x - current.x);
    const dy = Math.abs(block.position.y - current.y);
    const dz = Math.abs(block.position.z - current.z);

    // Prefer targets that are closer and closer to the bot's current elevation.
    return (dy * 4) + dx + dz;
  }

  function shouldScoutBlock(block) {
    const current = currentEntityPosition();
    if (!current || !block?.position) {
      return false;
    }

    const horizontal = Math.abs(block.position.x - current.x) + Math.abs(block.position.z - current.z);
    const vertical = Math.abs(block.position.y - current.y);
    return vertical > 1 || horizontal > 5;
  }

  function scaffoldInventoryCount() {
    return countInventoryItems(SCAFFOLD_ITEM_NAMES);
  }

  function isRecoverablePathError(error) {
    const message = error?.message?.toLowerCase?.() || '';
    return message.includes('path')
      || message.includes('goal')
      || message.includes('took too long')
      || message.includes('no route')
      || message.includes('unreachable');
  }

  async function stopAllActions() {
    try {
      bot.pathfinder.setGoal(null);
    } catch (error) {
      // Ignore pathfinder cleanup noise.
    }

    try {
      if (typeof bot.clearControlStates === 'function') {
        bot.clearControlStates();
      } else if (typeof bot.setControlState === 'function') {
        for (const state of ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak']) {
          bot.setControlState(state, false);
        }
      }
    } catch (error) {
      // Ignore control-state cleanup noise.
    }

    if (bot.collectBlock?.cancelTask) {
      try {
        await bot.collectBlock.cancelTask();
      } catch (error) {
        // Ignore collectblock cleanup noise.
      }
    }
  }

  async function goNearBlock(block, radius = 2) {
    await bot.pathfinder.goto(new goals.GoalNear(
      block.position.x,
      block.position.y,
      block.position.z,
      radius
    ));
  }

  async function goToSavedPosition(position, radius = 1, signal = null) {
    if (!position) {
      throw new Error('That location is not set yet.');
    }

    if (position.dimension && currentDimension() && position.dimension !== currentDimension()) {
      throw new Error(`That location is in ${position.dimension}, not ${currentDimension()}.`);
    }

    throwIfAborted(signal);
    await bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, radius));
    throwIfAborted(signal);
  }

  function blockIsAir(block) {
    return !block || block.boundingBox === 'empty';
  }

  function isSolidBlock(block) {
    return !!block && block.boundingBox === 'block';
  }

  function findPlacementLocation(maxDistance = PLACEMENT_SEARCH_DISTANCE) {
    const origin = bot.entity.position.floored();

    for (let radius = 1; radius <= maxDistance; radius += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          for (let dz = -radius; dz <= radius; dz += 1) {
            if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) {
              continue;
            }

            const targetPos = origin.offset(dx, dy, dz);
            const targetBlock = bot.blockAt(targetPos);
            const aboveBlock = bot.blockAt(targetPos.offset(0, 1, 0));
            const referenceBlock = bot.blockAt(targetPos.offset(0, -1, 0));

            if (!blockIsAir(targetBlock) || !blockIsAir(aboveBlock)) {
              continue;
            }

            if (!isSolidBlock(referenceBlock)) {
              continue;
            }

            return {
              targetPos,
              referenceBlock,
              faceVector: targetPos.minus(referenceBlock.position)
            };
          }
        }
      }
    }

    return null;
  }

  function itemIdByName(name) {
    return context.mcData?.itemsByName?.[name]?.id ?? bot.registry.itemsByName[name]?.id ?? null;
  }

  function recipeResultCount(recipe) {
    return recipe?.result?.count ?? 1;
  }

  function currentNearbyCraftingTable() {
    return nearestCraftingTable();
  }

  async function craftItemByName(itemName, count = 1, craftingTableBlock = null, signal = null) {
    const itemId = itemIdByName(itemName);
    if (!itemId) {
      throw new Error(`I don't know how to make ${itemName}.`);
    }

    if (craftingTableBlock) {
      throwIfAborted(signal);
      await goNearBlock(craftingTableBlock, 3);
    }

    const recipe = bot.recipesFor(itemId, null, 1, craftingTableBlock)[0];
    if (!recipe) {
      throw new Error(`I don't have the materials to craft ${itemName}.`);
    }

    throwIfAborted(signal);
    await bot.craft(recipe, count, craftingTableBlock);
    throwIfAborted(signal);
  }

  async function craftPlanks(outputCount, signal = null) {
    const desiredOutput = Math.max(1, Number(outputCount) || 0);
    const startCount = countInventoryItems(WOOD_PLANK_NAMES);
    let craftedAny = false;

    const logStacks = bot.inventory.items().filter((item) => WOOD_ITEM_NAMES.includes(item.name));
    for (const stack of logStacks) {
      const craftedSoFar = countInventoryItems(WOOD_PLANK_NAMES) - startCount;
      const remainingOutput = desiredOutput - craftedSoFar;
      if (remainingOutput <= 0) {
        break;
      }

      const plankName = plankNameForLog(stack.name);
      if (!plankName) {
        continue;
      }

      const plankId = itemIdByName(plankName);
      if (!plankId) {
        continue;
      }

      const recipe = bot.recipesFor(plankId, null, 1, null)[0];
      if (!recipe) {
        continue;
      }

      const craftsNeeded = Math.min(stack.count, craftsNeededForOutput(remainingOutput, recipeResultCount(recipe)));
      if (craftsNeeded <= 0) {
        continue;
      }

      throwIfAborted(signal);
      await bot.craft(recipe, craftsNeeded, null);
      craftedAny = true;
    }

    const crafted = countInventoryItems(WOOD_PLANK_NAMES) - startCount;
    if (!craftedAny || crafted < desiredOutput) {
      const missing = Math.max(0, desiredOutput - crafted);
      throw new Error(`I need ${missing} more planks worth of logs.`);
    }

    context.logger?.info?.('inventory.delta', {
      itemGroup: 'planks',
      change: crafted,
      total: countInventoryItems(WOOD_PLANK_NAMES)
    });
    return {
      crafted,
      total: countInventoryItems(WOOD_PLANK_NAMES)
    };
  }

  async function ensurePlanks(minPlanks, signal = null) {
    let missingPlanks = minPlanks - countInventoryItems(WOOD_PLANK_NAMES);
    if (missingPlanks <= 0) {
      return;
    }

    await craftPlanks(missingPlanks, signal);
  }

  async function craftSticks(outputCount = DEFAULT_CRAFT_STICK_TARGET, signal = null) {
    const desiredOutput = Math.max(1, Number(outputCount) || 0);
    const startCount = countInventoryItem('stick');
    const stickId = itemIdByName('stick');
    if (!stickId) {
      throw new Error("I don't know how to make sticks.");
    }

    await ensurePlanks(planksNeededForStickCount(desiredOutput), signal);

    const recipe = bot.recipesFor(stickId, null, 1, null)[0];
    if (!recipe) {
      throw new Error("I don't have the materials to craft sticks.");
    }

    const craftsNeeded = craftsNeededForOutput(desiredOutput, recipeResultCount(recipe));
    throwIfAborted(signal);
    await bot.craft(recipe, craftsNeeded, null);
    throwIfAborted(signal);

    const crafted = countInventoryItem('stick') - startCount;
    context.logger?.info?.('inventory.delta', {
      itemGroup: 'sticks',
      change: crafted,
      total: countInventoryItem('stick')
    });
    return {
      crafted,
      total: countInventoryItem('stick')
    };
  }

  async function ensureSticks(minSticks, signal = null) {
    const missingSticks = minSticks - countInventoryItem('stick');
    if (missingSticks <= 0) {
      return;
    }

    await craftSticks(missingSticks, signal);
  }

  function bestToolName(role) {
    return bestToolNameForItems(role, inventoryItemNames());
  }

  function toolDisplayName(toolName) {
    return toolName.replaceAll('_', ' ');
  }

  async function equipPreferredTool(role, { required = false } = {}) {
    const toolName = bestToolName(role);
    if (!toolName) {
      if (required) {
        throw new Error(`I don't have a usable ${role}.`);
      }

      return null;
    }

    const item = findInventoryItem([toolName]);
    if (!item) {
      if (required) {
        throw new Error(`I don't have a usable ${role}.`);
      }

      return null;
    }

    await bot.equip(item, 'hand');
    context.state.setPreferredTool?.(role, toolName);
    return {
      role,
      toolName,
      displayName: toolDisplayName(toolName)
    };
  }

  async function craftWoodenAxe(signal = null) {
    const startCount = countInventoryItem('wooden_axe');
    const craftingTable = await ensureCraftingTableAccess(signal);
    await ensureSticks(2, signal);
    await ensurePlanks(3, signal);
    await craftItemByName('wooden_axe', 1, craftingTable, signal);

    return {
      crafted: countInventoryItem('wooden_axe') - startCount,
      total: countInventoryItem('wooden_axe')
    };
  }

  async function craftWoodenPickaxe(signal = null) {
    const startCount = countInventoryItem('wooden_pickaxe');
    const craftingTable = await ensureCraftingTableAccess(signal);
    await ensureSticks(2, signal);
    await ensurePlanks(3, signal);
    await craftItemByName('wooden_pickaxe', 1, craftingTable, signal);

    return {
      crafted: countInventoryItem('wooden_pickaxe') - startCount,
      total: countInventoryItem('wooden_pickaxe')
    };
  }

  function ensureCobblestone(minCobblestone) {
    const current = countInventoryItem('cobblestone');
    if (current < minCobblestone) {
      throw new Error(`I need ${minCobblestone - current} more cobblestone.`);
    }
  }

  async function craftStoneAxe(signal = null) {
    const startCount = countInventoryItem('stone_axe');
    const craftingTable = await ensureCraftingTableAccess(signal);
    await ensureSticks(2, signal);
    ensureCobblestone(3);
    await craftItemByName('stone_axe', 1, craftingTable, signal);

    return {
      crafted: countInventoryItem('stone_axe') - startCount,
      total: countInventoryItem('stone_axe')
    };
  }

  async function craftStonePickaxe(signal = null) {
    const startCount = countInventoryItem('stone_pickaxe');
    const craftingTable = await ensureCraftingTableAccess(signal);
    await ensureSticks(2, signal);
    ensureCobblestone(3);
    await craftItemByName('stone_pickaxe', 1, craftingTable, signal);

    return {
      crafted: countInventoryItem('stone_pickaxe') - startCount,
      total: countInventoryItem('stone_pickaxe')
    };
  }

  async function ensureToolForRole(role, signal = null) {
    const toolName = bestToolName(role);
    if (toolName) {
      return toolName;
    }

    if (role === 'pickaxe') {
      await craftWoodenPickaxe(signal);
      return 'wooden_pickaxe';
    }

    if (role === 'axe') {
      await craftWoodenAxe(signal);
      return 'wooden_axe';
    }

    throw new Error(`I don't know how to prepare a ${role}.`);
  }

  async function placeInventoryBlock(itemName, signal = null) {
    const item = findInventoryItem([itemName]);
    if (!item) {
      throw new Error(`I don't have a ${itemName} to place.`);
    }

    const placement = findPlacementLocation();
    if (!placement) {
      throw new Error(`I couldn't find a spot to place a ${itemName}.`);
    }

    throwIfAborted(signal);
    await bot.pathfinder.goto(new goals.GoalPlaceBlock(placement.targetPos, bot.world, { range: 4 }));
    await bot.equip(item, 'hand');
    await bot.lookAt(placement.targetPos.offset(0.5, 0.5, 0.5), true);
    await bot.placeBlock(placement.referenceBlock, placement.faceVector);
    throwIfAborted(signal);

    const placedBlock = bot.blockAt(placement.targetPos);
    if (!placedBlock) {
      throw new Error(`I placed the ${itemName}, but I can't find it now.`);
    }

    return placedBlock;
  }

  function savedCraftingTablePosition() {
    return context.state.getCraftingTablePosition();
  }

  function savedCraftingTableBlock() {
    const position = savedCraftingTablePosition();
    if (!position) {
      return null;
    }

    if (position.dimension && currentDimension() && position.dimension !== currentDimension()) {
      return null;
    }

    const block = blockAtSavedPosition(position);
    return block?.name === 'crafting_table' ? block : null;
  }

  async function ensureCraftingTableAccess(signal = null) {
    const nearbyTable = nearestCraftingTable();
    if (nearbyTable) {
      context.state.setCraftingTablePosition?.(normalizeDimensionedPosition(nearbyTable.position));
      return nearbyTable;
    }

    const savedTable = savedCraftingTableBlock();
    if (savedTable) {
      return savedTable;
    }

    if (findInventoryItem(['crafting_table'])) {
      const placed = await placeInventoryBlock('crafting_table', signal);
      context.state.setCraftingTablePosition?.(normalizeDimensionedPosition(placed.position));
      return placed;
    }

    await craftCraftingTable(signal);
    const placed = await placeInventoryBlock('crafting_table', signal);
    context.state.setCraftingTablePosition?.(normalizeDimensionedPosition(placed.position));
    return placed;
  }

  async function craftCraftingTable(signal = null) {
    const startCount = countInventoryItem('crafting_table');
    await ensurePlanks(4, signal);
    await craftItemByName('crafting_table', 1, null, signal);

    return {
      crafted: countInventoryItem('crafting_table') - startCount,
      total: countInventoryItem('crafting_table')
    };
  }

  async function ensureChestStorage(signal = null) {
    const nearbyChest = nearestChestBlock();
    if (nearbyChest) {
      return nearbyChest;
    }

    if (findInventoryItem(['chest'])) {
      return placeInventoryBlock('chest', signal);
    }

    await craftChest(signal);
    return placeInventoryBlock('chest', signal);
  }

  async function craftChest(signal = null) {
    const startCount = countInventoryItem('chest');
    const craftingTable = await ensureCraftingTableAccess(signal);
    await ensurePlanks(8, signal);
    await craftItemByName('chest', 1, craftingTable, signal);

    return {
      crafted: countInventoryItem('chest') - startCount,
      total: countInventoryItem('chest'),
      craftingTableUsed: craftingTable
    };
  }

  async function placeCraftingTable({ remember = true, signal = null } = {}) {
    if (!findInventoryItem(['crafting_table'])) {
      await craftCraftingTable(signal);
    }

    const placedBlock = await placeInventoryBlock('crafting_table', signal);
    const position = normalizeDimensionedPosition(placedBlock.position);
    if (remember) {
      context.state.setCraftingTablePosition?.(position);
      context.logger?.info?.('state.crafting_table_saved', { position });
    }

    return {
      block: placedBlock,
      position
    };
  }

  async function placeChest({ remember = false, signal = null } = {}) {
    if (!findInventoryItem(['chest'])) {
      await craftChest(signal);
    }

    const placedBlock = await placeInventoryBlock('chest', signal);
    const position = normalizeDimensionedPosition(placedBlock.position);

    if (remember) {
      context.state.setChestPosition(position);
      context.logger?.info?.('state.chest_saved', { position });
    }

    return {
      block: placedBlock,
      position
    };
  }

  async function depositItemsInChest(chestBlock, stacks, targetCount = null, signal = null) {
    if (stacks.length === 0) {
      throw new Error("I don't have anything to deposit.");
    }

    throwIfAborted(signal);
    await goNearBlock(chestBlock, 3);
    const chest = await bot.openContainer(chestBlock);
    let deposited = 0;
    let remaining = targetCount;

    try {
      for (const stack of stacks) {
        throwIfAborted(signal);
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
      throw new Error(`I only had ${deposited} items ready to deposit.`);
    }

    context.logger?.info?.('inventory.deposit', {
      deposited,
      chest: normalizeDimensionedPosition(chestBlock.position)
    });
    return deposited;
  }

  function containerItemStacks(container) {
    if (typeof container.containerItems === 'function') {
      return container.containerItems();
    }

    if (typeof container.items === 'function') {
      return container.items();
    }

    return [];
  }

  async function readChestItems(chestBlock, signal = null) {
    throwIfAborted(signal);
    await goNearBlock(chestBlock, 3);
    const chest = await bot.openContainer(chestBlock);

    try {
      return containerItemStacks(chest);
    } finally {
      chest.close();
    }
  }

  function woodStockCountFromStacks(stacks) {
    return stacks
      .filter((item) => WOOD_ITEM_NAMES.includes(item.name))
      .reduce((sum, item) => sum + item.count, 0);
  }

  function woodMaintenanceState() {
    return context.state.getWoodMaintenance?.() || {
      enabled: false,
      minimumChestWood: DEFAULT_WOOD_STOCK_TARGET,
      lastCheck: null,
      lastStock: null,
      cooldownUntil: null
    };
  }

  function resolveWoodStockTarget(requestedMinimum = null) {
    const parsed = Number.parseInt(String(requestedMinimum ?? ''), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return woodMaintenanceState().minimumChestWood || DEFAULT_WOOD_STOCK_TARGET;
  }

  function updateWoodMaintenanceState(patch) {
    return context.state.setWoodMaintenance?.(patch) || null;
  }

  async function inspectSavedChestWoodStock(requestedMinimum = null, signal = null) {
    const target = resolveWoodStockTarget(requestedMinimum);
    const chestBlock = savedChestBlock();
    const items = await readChestItems(chestBlock, signal);
    const count = woodStockCountFromStacks(items);
    const summary = {
      count,
      target,
      deficit: Math.max(0, target - count),
      needsRefill: count < target,
      checkedAt: new Date().toISOString(),
      chestPosition: normalizeDimensionedPosition(chestBlock.position)
    };

    updateWoodMaintenanceState({
      lastCheck: summary.checkedAt,
      minimumChestWood: target,
      lastStock: summary
    });

    context.logger?.info?.('wood_stock.inspected', {
      count,
      target,
      chestPosition: summary.chestPosition
    });

    return summary;
  }

  function woodStockStatusMessage(stock, { includeMode = true } = {}) {
    const maintenance = woodMaintenanceState();
    const modePart = includeMode
      ? ` Maintenance ${maintenance.enabled ? 'on' : 'off'}.`
      : '';

    if (stock.needsRefill) {
      return `Wood stock low: ${stock.count}/${stock.target} logs in the chest.${modePart}`;
    }

    return `Wood stock okay: ${stock.count}/${stock.target} logs in the chest.${modePart}`;
  }

  function resourceStacks(mode) {
    const items = bot.inventory.items();

    if (mode === 'wood') {
      return items.filter((item) => WOOD_ITEM_NAMES.includes(item.name));
    }

    if (mode === 'stone') {
      return items.filter((item) => COBBLE_ITEM_NAMES.includes(item.name));
    }

    if (mode === 'resources') {
      return items.filter((item) => DEPOSIT_RESOURCE_NAMES.includes(item.name));
    }

    if (mode === 'equipment') {
      return items.filter((item) => isEquipmentItemName(item.name));
    }

    return items.filter((item) => !isEquipmentItemName(item.name));
  }

  function currentPositionRecord() {
    if (!bot.entity?.position) {
      throw new Error('I do not know where I am yet.');
    }

    return normalizeDimensionedPosition(bot.entity.position);
  }

  function saveHomePosition() {
    const position = context.state.setHomePosition(currentPositionRecord());
    context.logger?.info?.('state.home_saved', { position });
    return position;
  }

  function selectedChestBlock(maxDistance = STORAGE_SEARCH_DISTANCE) {
    const lookedAtChest = typeof bot.blockAtCursor === 'function'
      ? bot.blockAtCursor(maxDistance)
      : null;

    if (lookedAtChest && CHEST_BLOCK_NAMES.includes(lookedAtChest.name)) {
      return lookedAtChest;
    }

    return nearestChestBlock(maxDistance);
  }

  function saveChestPosition() {
    const chestBlock = selectedChestBlock();
    if (!chestBlock) {
      throw new Error('Look at a chest or stand near one first.');
    }

    const savedChest = context.state.setChestPosition({
      ...normalizeDimensionedPosition(chestBlock.position),
      dimension: currentDimension()
    });
    context.logger?.info?.('state.chest_saved', { position: savedChest });

    return {
      chestBlock,
      position: savedChest
    };
  }

  function positionToVec(position) {
    if (!bot.entity?.position?.constructor) {
      throw new Error('I cannot resolve positions before spawn.');
    }

    const Vec = bot.entity.position.constructor;
    return new Vec(position.x, position.y, position.z);
  }

  function blockAtSavedPosition(position) {
    return bot.blockAt(positionToVec(position));
  }

  function savedHomePosition() {
    return context.state.getHomePosition();
  }

  function savedChestPosition() {
    return context.state.getChestPosition();
  }

  function savedChestBlock() {
    const position = savedChestPosition();
    if (!position) {
      throw new Error('Chest is not set yet.');
    }

    if (position.dimension && currentDimension() && position.dimension !== currentDimension()) {
      throw new Error(`Saved chest is in ${position.dimension}, not ${currentDimension()}.`);
    }

    const block = blockAtSavedPosition(position);
    if (!block || !CHEST_BLOCK_NAMES.includes(block.name)) {
      throw new Error('Saved chest is missing or is no longer a chest.');
    }

    return block;
  }

  function craftStatusSummary() {
    const snapshot = context.state.getSnapshot?.() || {};
    const status = snapshot.taskStatus || context.tasks.getStatus();
    const statePart = status.taskName ? `${status.state} ${status.taskName}` : 'idle';
    const logs = countInventoryItems(WOOD_ITEM_NAMES);
    const planks = countInventoryItems(WOOD_PLANK_NAMES);
    const sticks = countInventoryItem('stick');
    const craftingTables = countInventoryItem('crafting_table');
    const chests = countInventoryItem('chest');
    const axes = countInventoryItems(AXE_TOOL_NAMES);
    const pickaxes = countInventoryItems(PICKAXE_TOOL_NAMES);
    const cobblestone = countInventoryItem('cobblestone');
    const nearbyTable = currentNearbyCraftingTable() ? 'nearby table ready' : `table ${formatSavedPosition(snapshot.craftingTablePosition)}`;

    return `Crafting: ${statePart}. Logs ${logs}. Planks ${planks}. Sticks ${sticks}. Cobble ${cobblestone}. Axes ${axes}. Pickaxes ${pickaxes}. Tables ${craftingTables}. Chests ${chests}. ${nearbyTable}. Last failure: ${failureSummary()}.`;
  }

  async function collectResources({
    blockNames,
    itemNames,
    targetCount,
    announceText,
    maxDistance = RESOURCE_SEARCH_DISTANCE,
    signal,
    noun
  }) {
    ensureReady();
    const attempted = new Set();

    const startCount = countInventoryItems(itemNames);
    if (announceText) {
      context.say(announceText);
    }
    context.logger?.info?.('workflow.collect.start', {
      noun,
      targetCount
    });

    while ((countInventoryItems(itemNames) - startCount) < targetCount) {
      throwIfAborted(signal);

      const candidatePositions = typeof bot.findBlocks === 'function'
        ? bot.findBlocks({
          matching: (candidate) => candidate && blockNames.includes(candidate.name),
          maxDistance,
          count: RESOURCE_CANDIDATE_COUNT
        })
        : [];

      const candidateBlocks = candidatePositions
        .map((position) => bot.blockAt(position))
        .filter((block) => block && !attempted.has(positionKey(block.position)))
        .sort((left, right) => blockTravelScore(left) - blockTravelScore(right));

      if (candidateBlocks.length === 0) {
        const fallbackBlock = bot.findBlock({
          matching: (candidate) => candidate && blockNames.includes(candidate.name),
          maxDistance
        });

        if (fallbackBlock && !attempted.has(positionKey(fallbackBlock.position))) {
          candidateBlocks.push(fallbackBlock);
        }
      }

      if (candidateBlocks.length === 0) {
        const gathered = countInventoryItems(itemNames) - startCount;
        return {
          ok: false,
          message: `I only found ${gathered} ${noun} nearby.`,
          data: { collected: gathered, complete: false }
        };
      }

      let collectedThisPass = false;
      for (const block of candidateBlocks) {
        throwIfAborted(signal);
        attempted.add(positionKey(block.position));

        try {
          await bot.collectBlock.collect(block);
          collectedThisPass = true;
          break;
        } catch (error) {
          if (isRecoverablePathError(error)) {
            context.logger?.warn?.('workflow.collect.recoverable_path_error', {
              noun,
              block: block?.name,
              position: block?.position ? normalizeDimensionedPosition(block.position) : null,
              message: error.message || String(error)
            });
            if (shouldScoutBlock(block)) {
              if (scaffoldInventoryCount() < 4) {
                await gatherNearbyScaffolding(4, signal);
              }

              try {
                await goNearBlock(block, 4);
                await bot.collectBlock.collect(block);
                collectedThisPass = true;
                break;
              } catch (scoutError) {
                if (!isRecoverablePathError(scoutError)) {
                  throw scoutError;
                }
              }
            }

            continue;
          }
          throw error;
        }
      }

      if (!collectedThisPass) {
        const gathered = countInventoryItems(itemNames) - startCount;
        context.logger?.warn?.('workflow.collect.unreachable', {
          noun,
          collected: gathered
        });
        return {
          ok: false,
          message: `I found nearby ${noun}, but I couldn't reach them.`,
          data: { collected: gathered, complete: false, unreachable: true }
        };
      }
    }

    const gathered = countInventoryItems(itemNames) - startCount;
    context.logger?.info?.('inventory.delta', {
      itemGroup: noun,
      change: gathered,
      total: countInventoryItems(itemNames)
    });
    return {
      ok: true,
      message: `Collected ${gathered} ${noun}.`,
      data: { collected: gathered, complete: true }
    };
  }

  async function prepareWoodChestPlan() {
    return planChestResources({
      hasNearbyChest: !!nearestChestBlock(),
      hasChestItem: !!findInventoryItem(['chest']),
      hasNearbyCraftingTable: !!nearestCraftingTable(),
      hasCraftingTableItem: !!findInventoryItem(['crafting_table']),
      plankCount: countInventoryItems(WOOD_PLANK_NAMES),
      logCount: countInventoryItems(WOOD_ITEM_NAMES)
    });
  }

  async function gatherNearbyScaffolding(minimumCount = 4, signal) {
    while (scaffoldInventoryCount() < minimumCount) {
      throwIfAborted(signal);

      const candidatePositions = typeof bot.findBlocks === 'function'
        ? bot.findBlocks({
          matching: (candidate) => candidate && SCAFFOLD_BLOCK_NAMES.includes(candidate.name),
          maxDistance: RESOURCE_SEARCH_DISTANCE,
          count: RESOURCE_CANDIDATE_COUNT
        })
        : [];

      const block = candidatePositions
        .map((position) => bot.blockAt(position))
        .filter(Boolean)
        .sort((left, right) => blockTravelScore(left) - blockTravelScore(right))[0];

      if (!block) {
        return {
          ok: false,
          collected: scaffoldInventoryCount(),
          message: "I couldn't find nearby dirt or stone for scaffolding."
        };
      }

      try {
        await bot.collectBlock.collect(block);
      } catch (error) {
        if (isRecoverablePathError(error)) {
          return {
            ok: false,
            collected: scaffoldInventoryCount(),
            message: "I couldn't reach nearby scaffolding blocks."
          };
        }
        throw error;
      }
    }

    return {
      ok: true,
      collected: scaffoldInventoryCount(),
      message: 'Scaffolding ready.'
    };
  }

  return {
    bestToolName,
    collectResources,
    craftStoneAxe,
    craftStonePickaxe,
    craftChest,
    craftCraftingTable,
    craftPlanks,
    craftStatusSummary,
    craftSticks,
    craftWoodenAxe,
    craftWoodenPickaxe,
    currentPositionRecord,
    countInventoryItem,
    countInventoryItems,
    depositItemsInChest,
    ensureToolForRole,
    ensureChestStorage,
    ensureReady,
    equipPreferredTool,
    findInventoryItem,
    formatCoordinates,
    formatSavedPosition,
    goToSavedPosition,
    inventorySummary,
    inspectSavedChestWoodStock,
    nearestChestBlock,
    placeChest,
    placeCraftingTable,
    prepareWoodChestPlan,
    gatherNearbyScaffolding,
    resourceStacks,
    resolveWoodStockTarget,
    failureSummary,
    saveChestPosition,
    saveHomePosition,
    savedChestBlock,
    savedChestPosition,
    savedCraftingTableBlock,
    savedCraftingTablePosition,
    savedHomePosition,
    statusSummary,
    toolDisplayName,
    updateWoodMaintenanceState,
    woodMaintenanceState,
    woodStockCountFromStacks,
    woodStockStatusMessage,
    stopAllActions
  };
}

module.exports = {
  createHelpers
};
