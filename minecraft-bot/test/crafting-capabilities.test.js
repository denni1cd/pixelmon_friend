const test = require('node:test');
const assert = require('node:assert/strict');

const craftChest = require('../src/bot/capabilities/craft-chest');
const craftPlanks = require('../src/bot/capabilities/craft-planks');
const craftStonePickaxe = require('../src/bot/capabilities/craft-stone-pickaxe');
const craftWoodenAxe = require('../src/bot/capabilities/craft-wooden-axe');
const cobbleRun = require('../src/bot/capabilities/cobble-run');
const craftStatus = require('../src/bot/capabilities/craft-status');
const equipAxe = require('../src/bot/capabilities/equip-axe');
const placeChest = require('../src/bot/capabilities/place-chest');
const stoneTools = require('../src/bot/capabilities/stone-tools');
const { createRuntimeState } = require('../src/bot/state');
const {
  bestToolNameForItems,
  craftsNeededForOutput,
  planksNeededForStickCount
} = require('../src/bot/resource-utils');

test('craft helpers calculate recipe requirements', () => {
  assert.equal(craftsNeededForOutput(16, 4), 4);
  assert.equal(craftsNeededForOutput(5, 4), 2);
  assert.equal(planksNeededForStickCount(8), 4);
  assert.equal(bestToolNameForItems('axe', ['wooden_axe']), 'wooden_axe');
  assert.equal(bestToolNameForItems('axe', ['wooden_axe', 'stone_axe']), 'stone_axe');
  assert.equal(bestToolNameForItems('pickaxe', ['wooden_pickaxe', 'stone_pickaxe']), 'stone_pickaxe');
});

test('craft_planks delegates to crafting helpers through the task manager', async () => {
  const calls = [];
  const context = {
    tasks: {
      async run(name, runner) {
        calls.push(name);
        return runner();
      }
    },
    helpers: {
      ensureReady() {},
      async craftPlanks(amount) {
        calls.push(['craftPlanks', amount]);
        return { crafted: amount, total: amount };
      },
      stopAllActions() {}
    }
  };

  const result = await craftPlanks.execute(context, { args: { amount: 16 } });

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Crafted 16 planks.');
  assert.deepEqual(calls, ['crafting 16 planks', ['craftPlanks', 16]]);
});

test('place_chest updates chest memory only after successful intentional placement', async () => {
  const state = createRuntimeState();
  let shouldFail = false;
  const context = {
    state,
    tasks: {
      async run(_, runner) {
        return runner();
      }
    },
    helpers: {
      ensureReady() {},
      async placeChest({ remember }) {
        if (shouldFail) {
          throw new Error("I couldn't find a spot to place a chest.");
        }

        if (remember) {
          state.setChestPosition({ x: 4, y: 64, z: 9, dimension: 'minecraft:overworld' });
        }

        return {
          position: state.getChestPosition()
        };
      },
      formatSavedPosition(position) {
        return `${position.x} ${position.y} ${position.z} (${position.dimension})`;
      },
      stopAllActions() {}
    }
  };

  const success = await placeChest.execute(context);
  assert.equal(success.ok, true);
  assert.deepEqual(state.getChestPosition(), {
    x: 4,
    y: 64,
    z: 9,
    dimension: 'minecraft:overworld'
  });

  shouldFail = true;
  try {
    await placeChest.execute(context);
    assert.fail('Expected place chest to throw on placement failure.');
  } catch (error) {
    assert.match(error.message, /couldn't find a spot/i);
  }

  assert.deepEqual(state.getChestPosition(), {
    x: 4,
    y: 64,
    z: 9,
    dimension: 'minecraft:overworld'
  });
});

test('craft_chest reports crafted inventory output', async () => {
  const context = {
    tasks: {
      async run(_, runner) {
        return runner();
      }
    },
    helpers: {
      ensureReady() {},
      async craftChest() {
        return { crafted: 1, total: 1 };
      },
      stopAllActions() {}
    }
  };

  const result = await craftChest.execute(context);
  assert.deepEqual(result, {
    ok: true,
    message: 'Crafted 1 chest.',
    data: { crafted: 1, total: 1 }
  });
});

test('craft_status reports crafting readiness summary', async () => {
  const result = await craftStatus.execute({
    helpers: {
      craftStatusSummary() {
        return 'Crafting: idle.';
      }
    }
  });

  assert.deepEqual(result, {
    ok: true,
    message: 'Crafting: idle.',
    data: null
  });
});

test('craft_wooden_axe delegates to tool crafting helpers through the task manager', async () => {
  const calls = [];
  const context = {
    tasks: {
      async run(name, runner) {
        calls.push(name);
        return runner();
      }
    },
    helpers: {
      ensureReady() {},
      async craftWoodenAxe() {
        calls.push('craftWoodenAxe');
        return { crafted: 1, total: 1 };
      },
      stopAllActions() {}
    }
  };

  const result = await craftWoodenAxe.execute(context);

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Crafted 1 wooden axe.');
  assert.deepEqual(calls, ['crafting wooden axe', 'craftWoodenAxe']);
});

test('craft_stone_pickaxe delegates to tool crafting helpers through the task manager', async () => {
  const calls = [];
  const context = {
    tasks: {
      async run(name, runner) {
        calls.push(name);
        return runner();
      }
    },
    helpers: {
      ensureReady() {},
      async craftStonePickaxe() {
        calls.push('craftStonePickaxe');
        return { crafted: 1, total: 1 };
      },
      stopAllActions() {}
    }
  };

  const result = await craftStonePickaxe.execute(context);

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Crafted 1 stone pickaxe.');
  assert.deepEqual(calls, ['crafting stone pickaxe', 'craftStonePickaxe']);
});

test('equip_axe equips the best available supported axe', async () => {
  const calls = [];
  const context = {
    tasks: {
      async run(name, runner) {
        calls.push(name);
        return runner();
      }
    },
    helpers: {
      ensureReady() {},
      async equipPreferredTool(role, options) {
        calls.push([role, options]);
        return { displayName: 'stone axe', toolName: 'stone_axe', role };
      },
      stopAllActions() {}
    }
  };

  const result = await equipAxe.execute(context);

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Equipped stone axe.');
  assert.deepEqual(calls, ['equipping axe', ['axe', { required: true }]]);
});

test('cobble_run composes gather and deposit through saved-chest deposit flow', async () => {
  const taskManager = {
    async run(name, runner) {
      assert.equal(name, 'cobble run 12');
      return runner({ signal: null });
    }
  };
  const calls = [];
  const context = {
    tasks: taskManager,
    say(message) {
      calls.push(['say', message]);
    },
    helpers: {
      async ensureToolForRole(role) {
        calls.push(['ensureTool', role]);
      },
      async equipPreferredTool(role, options) {
        calls.push(['equipTool', role, options]);
        return { toolName: 'stone_pickaxe', displayName: 'stone pickaxe' };
      },
      async collectResources(options) {
        calls.push(['gather', options.targetCount, options.noun]);
        return {
          ok: true,
          data: { collected: 12, complete: true }
        };
      },
      stopAllActions() {}
    },
    registry: {
      resolve(name) {
        if (name !== 'deposit') {
          return null;
        }

        return {
          async perform(_, command) {
            calls.push(['deposit', command.args]);
            return {
              ok: true,
              data: { deposited: 12 }
            };
          }
        };
      }
    }
  };

  const result = await cobbleRun.execute(context, { args: { amount: 12 } });

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Cobble run complete: gathered and deposited 12 cobblestone.');
  assert.deepEqual(calls, [
    ['ensureTool', 'pickaxe'],
    ['equipTool', 'pickaxe', { required: true }],
    ['gather', 12, 'cobblestone'],
    ['say', 'Heading back to the saved chest.'],
    ['deposit', { mode: 'stone', amount: 12, target: 'saved' }]
  ]);
});

test('stone_tools crafts only missing supported stone tools', async () => {
  const calls = [];
  const inventory = new Set();
  const context = {
    tasks: {
      async run(name, runner) {
        assert.equal(name, 'crafting stone tools');
        return runner();
      }
    },
    helpers: {
      ensureReady() {},
      findInventoryItem(names) {
        return names.some((name) => inventory.has(name)) ? { name: names.find((name) => inventory.has(name)) } : null;
      },
      async craftStonePickaxe() {
        calls.push('pickaxe');
        inventory.add('stone_pickaxe');
        return { crafted: 1, total: 1 };
      },
      async craftStoneAxe() {
        calls.push('axe');
        inventory.add('stone_axe');
        return { crafted: 1, total: 1 };
      },
      stopAllActions() {}
    }
  };

  const result = await stoneTools.execute(context);
  assert.equal(result.ok, true);
  assert.equal(result.message, 'Crafted stone pickaxe and stone axe.');
  assert.deepEqual(calls, ['pickaxe', 'axe']);
});
