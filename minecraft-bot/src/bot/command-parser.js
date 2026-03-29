const {
  DEFAULT_COBBLE_TARGET,
  DEFAULT_CRAFT_PLANK_TARGET,
  DEFAULT_CRAFT_STICK_TARGET,
  DEFAULT_GATHER_TARGET,
  parseCountCommand
} = require('./resource-utils');
const { DEFAULT_WOOD_STOCK_TARGET } = require('./constants');

function parseGotoCommand(message) {
  if (message === 'goto') {
    return {
      matched: true,
      coordinates: null,
      error: 'Use something like: goto 10 64 -3'
    };
  }

  if (!message.startsWith('goto ')) {
    return { matched: false, coordinates: null, error: null };
  }

  const parts = message.split(/\s+/);
  if (parts.length !== 4) {
    return {
      matched: true,
      coordinates: null,
      error: 'Use something like: goto 10 64 -3'
    };
  }

  const coordinates = parts.slice(1).map((value) => Number(value));
  if (coordinates.some((value) => !Number.isFinite(value))) {
    return {
      matched: true,
      coordinates: null,
      error: 'Use something like: goto 10 64 -3'
    };
  }

  return {
    matched: true,
    coordinates: {
      x: coordinates[0],
      y: coordinates[1],
      z: coordinates[2]
    },
    error: null
  };
}

function parseChatCommand(message) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'bot') {
    return {
      matched: true,
      name: 'chat',
      args: { prompt: '' },
      error: null
    };
  }

  if (lower.startsWith('bot ')) {
    return {
      matched: true,
      name: 'chat',
      args: { prompt: trimmed.slice(3).trim() },
      error: null
    };
  }

  if (lower.startsWith('bot,')) {
    return {
      matched: true,
      name: 'chat',
      args: { prompt: trimmed.slice(4).trim() },
      error: null
    };
  }

  if (lower === 'follow me') {
    return { matched: true, name: 'follow', args: {}, error: null };
  }

  if (lower === 'set home') {
    return { matched: true, name: 'set_home', args: {}, error: null };
  }

  if (lower === 'set chest') {
    return { matched: true, name: 'set_chest', args: {}, error: null };
  }

  if (lower === 'go home') {
    return { matched: true, name: 'go_home', args: {}, error: null };
  }

  if (lower === 'where is home') {
    return { matched: true, name: 'where_home', args: {}, error: null };
  }

  if (lower === 'where is chest') {
    return { matched: true, name: 'where_chest', args: {}, error: null };
  }

  if (lower === 'check wood stock' || lower === 'wood stock status') {
    return { matched: true, name: 'check_wood_stock', args: {}, error: null };
  }

  if (
    lower === 'inspect chest'
    || lower === 'check chest'
    || lower === 'inspect the chest'
    || lower === 'check the chest'
    || lower === 'inspect chest stock'
    || lower === 'check chest stock'
    || lower === 'inspect chest inventory'
    || lower === 'check chest inventory'
    || lower === 'inspect the chest inventory'
    || lower === 'check the chest inventory'
  ) {
    return { matched: true, name: 'check_wood_stock', args: {}, error: null };
  }

  if (lower === 'enable wood maintenance') {
    return { matched: true, name: 'enable_wood_maintenance', args: {}, error: null };
  }

  if (lower === 'disable wood maintenance') {
    return { matched: true, name: 'disable_wood_maintenance', args: {}, error: null };
  }

  if (lower === 'stop') {
    return { matched: true, name: 'stop', args: {}, error: null };
  }

  if (lower === 'cancel') {
    return { matched: true, name: 'stop', args: {}, error: null };
  }

  if (lower === 'come here') {
    return { matched: true, name: 'come_here', args: {}, error: null };
  }

  if (lower === 'inventory') {
    return { matched: true, name: 'inventory', args: {}, error: null };
  }

  if (
    lower === 'status'
    || lower === 'what are you doing'
    || lower === 'what are you doing?'
    || lower === 'what went wrong'
    || lower === 'what went wrong?'
    || lower === 'are you busy'
    || lower === 'are you busy?'
  ) {
    return { matched: true, name: 'status', args: {}, error: null };
  }

  if (lower === 'craft status') {
    return { matched: true, name: 'craft_status', args: {}, error: null };
  }

  if (lower === 'craft crafting table') {
    return { matched: true, name: 'craft_crafting_table', args: {}, error: null };
  }

  if (lower === 'craft chest') {
    return { matched: true, name: 'craft_chest', args: {}, error: null };
  }

  if (lower === 'craft wooden axe') {
    return { matched: true, name: 'craft_wooden_axe', args: {}, error: null };
  }

  if (lower === 'craft wooden pickaxe') {
    return { matched: true, name: 'craft_wooden_pickaxe', args: {}, error: null };
  }

  if (lower === 'craft stone axe') {
    return { matched: true, name: 'craft_stone_axe', args: {}, error: null };
  }

  if (lower === 'craft stone pickaxe') {
    return { matched: true, name: 'craft_stone_pickaxe', args: {}, error: null };
  }

  if (lower === 'equip axe') {
    return { matched: true, name: 'equip_axe', args: {}, error: null };
  }

  if (lower === 'equip pickaxe') {
    return { matched: true, name: 'equip_pickaxe', args: {}, error: null };
  }

  if (lower === 'stone tools') {
    return { matched: true, name: 'stone_tools', args: {}, error: null };
  }

  if (lower === 'place crafting table') {
    return { matched: true, name: 'place_crafting_table', args: {}, error: null };
  }

  if (lower === 'place chest') {
    return { matched: true, name: 'place_chest', args: {}, error: null };
  }

  const gotoCommand = parseGotoCommand(lower);
  if (gotoCommand.matched) {
    return {
      matched: true,
      name: 'goto',
      args: gotoCommand.coordinates,
      error: gotoCommand.error
    };
  }

  const craftPlanksCommand = parseCountCommand(lower, 'craft planks', DEFAULT_CRAFT_PLANK_TARGET);
  if (craftPlanksCommand.matched) {
    return {
      matched: true,
      name: 'craft_planks',
      args: { amount: craftPlanksCommand.amount ?? DEFAULT_CRAFT_PLANK_TARGET },
      error: craftPlanksCommand.error
    };
  }

  const craftSticksCommand = parseCountCommand(lower, 'craft sticks', DEFAULT_CRAFT_STICK_TARGET);
  if (craftSticksCommand.matched) {
    return {
      matched: true,
      name: 'craft_sticks',
      args: { amount: craftSticksCommand.amount ?? DEFAULT_CRAFT_STICK_TARGET },
      error: craftSticksCommand.error
    };
  }

  const cobbleCommand = parseCountCommand(lower, 'cobble', DEFAULT_COBBLE_TARGET);
  if (cobbleCommand.matched) {
    return {
      matched: true,
      name: 'cobble_run',
      args: { amount: cobbleCommand.amount ?? DEFAULT_COBBLE_TARGET },
      error: cobbleCommand.error
    };
  }

  const woodRunCommand = parseCountCommand(lower, 'wood run');
  if (woodRunCommand.matched) {
    return {
      matched: true,
      name: 'wood_run',
      args: { amount: woodRunCommand.amount ?? DEFAULT_GATHER_TARGET },
      error: woodRunCommand.error
    };
  }

  const woodCommand = parseCountCommand(lower, 'wood');
  if (woodCommand.matched) {
    return {
      matched: true,
      name: 'gather_wood',
      args: { amount: woodCommand.amount ?? DEFAULT_GATHER_TARGET },
      error: woodCommand.error
    };
  }

  const maintainWoodCommand = parseCountCommand(lower, 'maintain wood', DEFAULT_WOOD_STOCK_TARGET);
  if (maintainWoodCommand.matched) {
    return {
      matched: true,
      name: 'maintain_wood',
      args: {
        minimumChestWood: maintainWoodCommand.amount ?? DEFAULT_WOOD_STOCK_TARGET,
        mode: 'run_once'
      },
      error: maintainWoodCommand.error
    };
  }

  const stoneCommand = parseCountCommand(lower, 'stone');
  if (stoneCommand.matched) {
    return {
      matched: true,
      name: 'gather_stone',
      args: { amount: stoneCommand.amount ?? DEFAULT_GATHER_TARGET },
      error: stoneCommand.error
    };
  }

  const stashWoodCommand = parseCountCommand(lower, 'stash wood');
  if (stashWoodCommand.matched) {
    return {
      matched: true,
      name: 'deposit',
      args: {
        mode: 'wood',
        amount: stashWoodCommand.amount ?? DEFAULT_GATHER_TARGET,
        ensureChest: true
      },
      error: stashWoodCommand.error
    };
  }

  if (lower === 'drop wood' || lower === 'pile wood') {
    return { matched: true, name: 'drop_wood', args: {}, error: null };
  }

  if (lower === 'deposit wood') {
    return {
      matched: true,
      name: 'deposit',
      args: { mode: 'wood', target: 'saved' },
      error: null
    };
  }

  if (lower === 'deposit all') {
    return {
      matched: true,
      name: 'deposit',
      args: { mode: 'all', target: 'saved' },
      error: null
    };
  }

  if (lower === 'deposit equipment') {
    return {
      matched: true,
      name: 'deposit',
      args: { mode: 'equipment', target: 'saved' },
      error: null
    };
  }

  if (lower === 'drop all') {
    return { matched: true, name: 'drop_all', args: {}, error: null };
  }

  if (lower === 'deposit' || lower === 'deposit nearest chest') {
    return {
      matched: true,
      name: 'deposit',
      args: { mode: 'all', ensureChest: false, target: 'nearby' },
      error: null
    };
  }

  return { matched: false, name: null, args: null, error: null };
}

module.exports = {
  parseChatCommand,
  parseGotoCommand
};
