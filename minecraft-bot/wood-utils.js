const DEFAULT_WOOD_TARGET = 8;

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

function parseCountCommand(message, command, defaultAmount = DEFAULT_WOOD_TARGET) {
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

module.exports = {
  DEFAULT_WOOD_TARGET,
  WOOD_BLOCK_NAMES,
  WOOD_PLANK_NAMES,
  parseCountCommand,
  planChestResources,
  plankNameForLog
};
