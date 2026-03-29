const test = require('node:test');
const assert = require('node:assert/strict');

const { parseChatCommand, parseGotoCommand } = require('../src/bot/command-parser');

test('parseGotoCommand extracts numeric coordinates', () => {
  assert.deepEqual(
    parseGotoCommand('goto 10 64 -3'),
    {
      matched: true,
      coordinates: { x: 10, y: 64, z: -3 },
      error: null
    }
  );
});

test('parseGotoCommand rejects malformed coordinates', () => {
  assert.equal(parseGotoCommand('goto nope 64 -3').error, 'Use something like: goto 10 64 -3');
});

test('parseChatCommand parses wood and stone gather commands', () => {
  assert.deepEqual(parseChatCommand('wood 12'), {
    matched: true,
    name: 'gather_wood',
    args: { amount: 12 },
    error: null
  });

  assert.deepEqual(parseChatCommand('stone'), {
    matched: true,
    name: 'gather_stone',
    args: { amount: 8 },
    error: null
  });
});

test('parseChatCommand accepts both bot space and legacy bot comma chat triggers', () => {
  assert.deepEqual(parseChatCommand('bot how is it going'), {
    matched: true,
    name: 'chat',
    args: { prompt: 'how is it going' },
    error: null
  });

  assert.deepEqual(parseChatCommand('bot, still works'), {
    matched: true,
    name: 'chat',
    args: { prompt: 'still works' },
    error: null
  });

  assert.deepEqual(parseChatCommand('bot'), {
    matched: true,
    name: 'chat',
    args: { prompt: '' },
    error: null
  });
});

test('parseChatCommand parses home, chest, deposit, and wood run commands', () => {
  assert.deepEqual(parseChatCommand('set home'), {
    matched: true,
    name: 'set_home',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('set chest'), {
    matched: true,
    name: 'set_chest',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('go home'), {
    matched: true,
    name: 'go_home',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('where is home'), {
    matched: true,
    name: 'where_home',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('where is chest'), {
    matched: true,
    name: 'where_chest',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('check wood stock'), {
    matched: true,
    name: 'check_wood_stock',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('wood stock status'), {
    matched: true,
    name: 'check_wood_stock',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('inspect chest'), {
    matched: true,
    name: 'check_wood_stock',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('check the chest inventory'), {
    matched: true,
    name: 'check_wood_stock',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('enable wood maintenance'), {
    matched: true,
    name: 'enable_wood_maintenance',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('disable wood maintenance'), {
    matched: true,
    name: 'disable_wood_maintenance',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('cancel'), {
    matched: true,
    name: 'stop',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('deposit wood'), {
    matched: true,
    name: 'deposit',
    args: { mode: 'wood', target: 'saved' },
    error: null
  });

  assert.deepEqual(parseChatCommand('deposit all'), {
    matched: true,
    name: 'deposit',
    args: { mode: 'all', target: 'saved' },
    error: null
  });

  assert.deepEqual(parseChatCommand('deposit equipment'), {
    matched: true,
    name: 'deposit',
    args: { mode: 'equipment', target: 'saved' },
    error: null
  });

  assert.deepEqual(parseChatCommand('wood run 16'), {
    matched: true,
    name: 'wood_run',
    args: { amount: 16 },
    error: null
  });

  assert.deepEqual(parseChatCommand('maintain wood 64'), {
    matched: true,
    name: 'maintain_wood',
    args: { minimumChestWood: 64, mode: 'run_once' },
    error: null
  });
});

test('parseChatCommand parses crafting commands', () => {
  assert.deepEqual(parseChatCommand('craft planks'), {
    matched: true,
    name: 'craft_planks',
    args: { amount: 4 },
    error: null
  });

  assert.deepEqual(parseChatCommand('craft planks 16'), {
    matched: true,
    name: 'craft_planks',
    args: { amount: 16 },
    error: null
  });

  assert.deepEqual(parseChatCommand('craft sticks 8'), {
    matched: true,
    name: 'craft_sticks',
    args: { amount: 8 },
    error: null
  });

  assert.deepEqual(parseChatCommand('craft crafting table'), {
    matched: true,
    name: 'craft_crafting_table',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('craft chest'), {
    matched: true,
    name: 'craft_chest',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('craft wooden axe'), {
    matched: true,
    name: 'craft_wooden_axe',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('craft wooden pickaxe'), {
    matched: true,
    name: 'craft_wooden_pickaxe',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('craft stone axe'), {
    matched: true,
    name: 'craft_stone_axe',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('craft stone pickaxe'), {
    matched: true,
    name: 'craft_stone_pickaxe',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('equip axe'), {
    matched: true,
    name: 'equip_axe',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('equip pickaxe'), {
    matched: true,
    name: 'equip_pickaxe',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('stone tools'), {
    matched: true,
    name: 'stone_tools',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('place crafting table'), {
    matched: true,
    name: 'place_crafting_table',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('place chest'), {
    matched: true,
    name: 'place_chest',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('craft status'), {
    matched: true,
    name: 'craft_status',
    args: {},
    error: null
  });
});

test('parseChatCommand maps deterministic status variants', () => {
  assert.deepEqual(parseChatCommand('what are you doing?'), {
    matched: true,
    name: 'status',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('what went wrong'), {
    matched: true,
    name: 'status',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('are you busy'), {
    matched: true,
    name: 'status',
    args: {},
    error: null
  });
});

test('parseChatCommand maps status and cancel conversational variants deterministically', () => {
  assert.deepEqual(parseChatCommand('cancel'), {
    matched: true,
    name: 'stop',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('what are you doing?'), {
    matched: true,
    name: 'status',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('are you busy'), {
    matched: true,
    name: 'status',
    args: {},
    error: null
  });

  assert.deepEqual(parseChatCommand('what went wrong?'), {
    matched: true,
    name: 'status',
    args: {},
    error: null
  });
});

test('parseChatCommand parses cobble commands', () => {
  assert.deepEqual(parseChatCommand('cobble'), {
    matched: true,
    name: 'cobble_run',
    args: { amount: 8 },
    error: null
  });

  assert.deepEqual(parseChatCommand('cobble 32'), {
    matched: true,
    name: 'cobble_run',
    args: { amount: 32 },
    error: null
  });
});

test('parseChatCommand preserves legacy stash wood routing', () => {
  assert.deepEqual(parseChatCommand('stash wood 8'), {
    matched: true,
    name: 'deposit',
    args: {
      mode: 'wood',
      amount: 8,
      ensureChest: true
    },
    error: null
  });
});

test('parseChatCommand parses deposit and drop all commands', () => {
  assert.deepEqual(parseChatCommand('deposit'), {
    matched: true,
    name: 'deposit',
    args: { mode: 'all', ensureChest: false, target: 'nearby' },
    error: null
  });

  assert.deepEqual(parseChatCommand('drop all'), {
    matched: true,
    name: 'drop_all',
    args: {},
    error: null
  });
});
