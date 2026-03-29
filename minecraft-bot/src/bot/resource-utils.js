const DEFAULT_GATHER_TARGET = 8;
const DEFAULT_WOOD_TARGET = DEFAULT_GATHER_TARGET;
const DEFAULT_STONE_TARGET = DEFAULT_GATHER_TARGET;
const DEFAULT_CRAFT_PLANK_TARGET = 4;
const DEFAULT_CRAFT_STICK_TARGET = 4;
const DEFAULT_COBBLE_TARGET = DEFAULT_GATHER_TARGET;

const WOOD_BLOCK_NAMES = [
  'oak_log',
  'spruce_log',
  'birch_log',
  'jungle_log',
  'acacia_log',
  'dark_oak_log',
  'mangrove_log',
  'cherry_log',
  'pale_oak_log'
];

const WOOD_ITEM_NAMES = [...WOOD_BLOCK_NAMES];

const WOOD_PLANK_NAMES = [
  'oak_planks',
  'spruce_planks',
  'birch_planks',
  'jungle_planks',
  'acacia_planks',
  'dark_oak_planks',
  'mangrove_planks',
  'cherry_planks',
  'pale_oak_planks'
];

const STONE_BLOCK_NAMES = [
  'stone',
  'cobblestone',
  'cobbled_deepslate'
];

const STONE_ITEM_NAMES = [
  'stone',
  'cobblestone',
  'cobbled_deepslate'
];

const CHEST_BLOCK_NAMES = ['chest', 'trapped_chest'];
const COBBLE_SOURCE_BLOCK_NAMES = ['stone', 'cobblestone'];
const COBBLE_ITEM_NAMES = ['cobblestone'];
const SCAFFOLD_BLOCK_NAMES = ['dirt', 'coarse_dirt', 'rooted_dirt', 'cobblestone', 'cobbled_deepslate'];
const SCAFFOLD_ITEM_NAMES = ['dirt', 'coarse_dirt', 'rooted_dirt', 'cobblestone', 'cobbled_deepslate', ...WOOD_PLANK_NAMES, ...WOOD_ITEM_NAMES];
const AXE_TOOL_NAMES = ['stone_axe', 'wooden_axe'];
const PICKAXE_TOOL_NAMES = ['stone_pickaxe', 'wooden_pickaxe'];

const DEPOSIT_RESOURCE_NAMES = Array.from(new Set([
  ...WOOD_ITEM_NAMES,
  ...WOOD_PLANK_NAMES,
  ...STONE_ITEM_NAMES
]));

const EQUIPMENT_NAME_PATTERNS = [
  '_axe',
  '_pickaxe',
  '_shovel',
  '_hoe',
  '_sword',
  '_helmet',
  '_chestplate',
  '_leggings',
  '_boots'
];

const EQUIPMENT_ITEM_NAMES = [
  'shield',
  'bow',
  'crossbow',
  'trident',
  'fishing_rod',
  'flint_and_steel',
  'shears',
  'carrot_on_a_stick',
  'warped_fungus_on_a_stick',
  'compass',
  'recovery_compass',
  'clock'
];

function craftsNeededForOutput(desiredCount, outputPerCraft) {
  if (!Number.isFinite(desiredCount) || desiredCount <= 0) {
    return 0;
  }

  if (!Number.isFinite(outputPerCraft) || outputPerCraft <= 0) {
    throw new Error('Recipe output must be a positive number.');
  }

  return Math.ceil(desiredCount / outputPerCraft);
}

function planksNeededForStickCount(stickCount, stickOutputPerCraft = 4, plankCostPerCraft = 2) {
  return craftsNeededForOutput(stickCount, stickOutputPerCraft) * plankCostPerCraft;
}

function parseCountCommand(message, command, defaultAmount = DEFAULT_GATHER_TARGET) {
  if (message === command) {
    return { matched: true, amount: defaultAmount, error: null };
  }

  if (!message.startsWith(`${command} `)) {
    return { matched: false, amount: null, error: null };
  }

  const amount = Number.parseInt(message.slice(command.length + 1), 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { matched: true, amount: null, error: `Use something like: ${command} ${defaultAmount}` };
  }

  return { matched: true, amount, error: null };
}

function planChestResources({
  hasNearbyChest,
  hasChestItem,
  hasNearbyCraftingTable,
  hasCraftingTableItem,
  plankCount,
  logCount
}) {
  const hasStorageAccess = hasNearbyChest || hasChestItem;
  const hasCraftingTableAccess = hasNearbyCraftingTable || hasCraftingTableItem;
  const requiredPlanks = hasStorageAccess ? 0 : (hasCraftingTableAccess ? 8 : 12);
  const availablePlanksEquivalent = plankCount + (logCount * 4);
  const missingPlanks = Math.max(0, requiredPlanks - availablePlanksEquivalent);
  const extraLogsNeeded = Math.ceil(missingPlanks / 4);

  return {
    hasStorageAccess,
    hasCraftingTableAccess,
    requiredPlanks,
    availablePlanksEquivalent,
    missingPlanks,
    extraLogsNeeded
  };
}

function plankNameForLog(logName) {
  return logName.endsWith('_log') ? logName.replace('_log', '_planks') : null;
}

function preferredToolNames(role) {
  if (role === 'axe') {
    return AXE_TOOL_NAMES;
  }

  if (role === 'pickaxe') {
    return PICKAXE_TOOL_NAMES;
  }

  return [];
}

function bestToolNameForItems(role, itemNames) {
  const available = new Set(itemNames);
  return preferredToolNames(role).find((name) => available.has(name)) || null;
}

function isEquipmentItemName(name) {
  if (!name) {
    return false;
  }

  if (EQUIPMENT_ITEM_NAMES.includes(name)) {
    return true;
  }

  return EQUIPMENT_NAME_PATTERNS.some((pattern) => name.endsWith(pattern));
}

module.exports = {
  AXE_TOOL_NAMES,
  CHEST_BLOCK_NAMES,
  COBBLE_ITEM_NAMES,
  COBBLE_SOURCE_BLOCK_NAMES,
  SCAFFOLD_BLOCK_NAMES,
  SCAFFOLD_ITEM_NAMES,
  craftsNeededForOutput,
  DEFAULT_CRAFT_PLANK_TARGET,
  DEFAULT_CRAFT_STICK_TARGET,
  DEFAULT_COBBLE_TARGET,
  DEFAULT_GATHER_TARGET,
  DEFAULT_STONE_TARGET,
  DEFAULT_WOOD_TARGET,
  DEPOSIT_RESOURCE_NAMES,
  EQUIPMENT_ITEM_NAMES,
  bestToolNameForItems,
  isEquipmentItemName,
  PICKAXE_TOOL_NAMES,
  planksNeededForStickCount,
  preferredToolNames,
  STONE_BLOCK_NAMES,
  STONE_ITEM_NAMES,
  WOOD_BLOCK_NAMES,
  WOOD_ITEM_NAMES,
  WOOD_PLANK_NAMES,
  parseCountCommand,
  planChestResources,
  plankNameForLog
};
