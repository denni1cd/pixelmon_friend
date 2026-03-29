const test = require('node:test');
const assert = require('node:assert/strict');

const {
  configureMovements,
  preferredScaffoldingIds,
  softDigBlockIds
} = require('../src/bot/movement-config');

test('preferredScaffoldingIds includes common build-up materials', () => {
  const registry = {
    itemsByName: {
      dirt: { id: 1 },
      cobblestone: { id: 2 },
      oak_planks: { id: 3 },
      oak_log: { id: 4 }
    }
  };

  assert.deepEqual(preferredScaffoldingIds(registry), [1, 2, 3, 4]);
});

test('softDigBlockIds includes leaves and soft path blockers', () => {
  const registry = {
    blocksByName: {
      oak_leaves: { id: 10 },
      vine: { id: 11 },
      short_grass: { id: 12 }
    }
  };

  assert.deepEqual(softDigBlockIds(registry), [10, 11, 12]);
});

test('configureMovements enables digging and expands scaffolding options', () => {
  const movements = {
    canDig: false,
    allow1by1towers: false,
    allowFreeMotion: false,
    placeCost: 1,
    digCost: 1,
    scafoldingBlocks: [2],
    blocksToAvoid: new Set([10, 99])
  };

  const registry = {
    itemsByName: {
      dirt: { id: 1 },
      cobblestone: { id: 2 },
      oak_planks: { id: 3 }
    },
    blocksByName: {
      oak_leaves: { id: 10 }
    }
  };

  configureMovements(movements, registry);

  assert.equal(movements.canDig, true);
  assert.equal(movements.allow1by1towers, true);
  assert.equal(movements.allowFreeMotion, true);
  assert.deepEqual(movements.scafoldingBlocks, [2, 1, 3]);
  assert.equal(movements.blocksToAvoid.has(10), false);
  assert.equal(movements.blocksToAvoid.has(99), true);
});
