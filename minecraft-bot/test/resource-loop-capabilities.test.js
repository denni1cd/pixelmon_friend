const test = require('node:test');
const assert = require('node:assert/strict');

const deposit = require('../src/bot/capabilities/deposit');
const checkWoodStock = require('../src/bot/capabilities/check-wood-stock');
const disableWoodMaintenance = require('../src/bot/capabilities/disable-wood-maintenance');
const enableWoodMaintenance = require('../src/bot/capabilities/enable-wood-maintenance');
const maintainWood = require('../src/bot/capabilities/maintain-wood');
const setHome = require('../src/bot/capabilities/set-home');
const setChest = require('../src/bot/capabilities/set-chest');
const woodRun = require('../src/bot/capabilities/wood-run');
const { TaskManager } = require('../src/bot/task-manager');
const { createRuntimeState } = require('../src/bot/state');

test('set_home stores the current bot position in runtime state', async () => {
  const state = createRuntimeState();
  const context = {
    state,
    helpers: {
      ensureReady() {},
      saveHomePosition() {
        return state.setHomePosition({ x: 10.8, y: 64, z: -3.2, dimension: 'minecraft:overworld' });
      },
      formatSavedPosition(position) {
        return `${position.x} ${position.y} ${position.z} (${position.dimension})`;
      }
    }
  };

  const result = await setHome.execute(context, { args: {} });

  assert.equal(result.ok, true);
  assert.equal(result.data.homePosition.x, 10);
  assert.equal(result.data.homePosition.z, -4);
  assert.equal(state.getHomePosition().dimension, 'minecraft:overworld');
});

test('set_chest stores the selected chest position in runtime state', async () => {
  const state = createRuntimeState();
  const context = {
    state,
    helpers: {
      ensureReady() {},
      saveChestPosition() {
        return {
          position: state.setChestPosition({ x: 2, y: 65, z: 7, dimension: 'minecraft:overworld' })
        };
      },
      formatSavedPosition(position) {
        return `${position.x} ${position.y} ${position.z} (${position.dimension})`;
      }
    }
  };

  const result = await setChest.execute(context, { args: {} });

  assert.equal(result.ok, true);
  assert.deepEqual(state.getChestPosition(), {
    x: 2,
    y: 65,
    z: 7,
    dimension: 'minecraft:overworld'
  });
  assert.match(result.message, /Chest saved at 2 65 7/);
});

test('deposit fails cleanly when a remembered chest has not been set', async () => {
  const result = await deposit.perform({
    helpers: {
      ensureReady() {},
      savedChestBlock() {
        throw new Error('Chest is not set yet.');
      }
    }
  }, {
    args: { mode: 'wood', target: 'saved' }
  });

  assert.deepEqual(result, {
    ok: false,
    message: 'Chest is not set yet.',
    data: null
  });
});

test('deposit all excludes equipment by default', async () => {
  const seen = [];
  const result = await deposit.perform({
    helpers: {
      ensureReady() {},
      savedChestBlock() {
        return { name: 'chest' };
      },
      resourceStacks(mode) {
        seen.push(mode);
        return [{ name: 'oak_log', count: 4, type: 1, metadata: 0 }];
      },
      async depositItemsInChest() {
        return 4;
      }
    }
  }, {
    args: { mode: 'all', target: 'saved' }
  });

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Deposited 4 non-equipment items into the saved chest.');
  assert.deepEqual(seen, ['all']);
});

test('deposit equipment uses the explicit equipment mode', async () => {
  const seen = [];
  const result = await deposit.perform({
    helpers: {
      ensureReady() {},
      savedChestBlock() {
        return { name: 'chest' };
      },
      resourceStacks(mode) {
        seen.push(mode);
        return [{ name: 'stone_pickaxe', count: 1, type: 1, metadata: 0 }];
      },
      async depositItemsInChest() {
        return 1;
      }
    }
  }, {
    args: { mode: 'equipment', target: 'saved' }
  });

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Deposited 1 equipment items into the saved chest.');
  assert.deepEqual(seen, ['equipment']);
});

test('check_wood_stock reports current chest logs and maintenance mode', async () => {
  const state = createRuntimeState();
  state.setWoodMaintenance({ enabled: true, minimumChestWood: 64 });
  const context = {
    state,
    tasks: new TaskManager({ state }),
    helpers: {
      ensureReady() {},
      async inspectSavedChestWoodStock() {
        return { count: 24, target: 64, needsRefill: true };
      },
      woodStockStatusMessage(stock) {
        return `Wood stock low: ${stock.count}/${stock.target} logs in the chest. Maintenance on.`;
      },
      stopAllActions() {}
    }
  };

  const result = await checkWoodStock.execute(context, { args: {} });
  assert.equal(result.ok, true);
  assert.equal(result.message, 'Wood stock low: 24/64 logs in the chest. Maintenance on.');
});

test('maintain_wood returns early when stock is already sufficient', async () => {
  const state = createRuntimeState();
  const context = {
    state,
    tasks: new TaskManager({ state }),
    registry: {
      resolve() {
        return null;
      }
    },
    helpers: {
      ensureReady() {},
      resolveWoodStockTarget(amount) {
        return amount ?? 64;
      },
      async inspectSavedChestWoodStock() {
        return { count: 64, target: 64, needsRefill: false };
      },
      woodStockStatusMessage() {
        return 'Wood stock okay: 64/64 logs in the chest.';
      },
      stopAllActions() {}
    }
  };

  const result = await maintainWood.execute(context, {
    args: { minimumChestWood: 64, mode: 'run_once' }
  });

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Wood stock okay: 64/64 logs in the chest. No refill needed.');
});

test('maintain_wood gathers and deposits when stock is low', async () => {
  const state = createRuntimeState();
  const calls = [];
  const context = {
    state,
    tasks: new TaskManager({ state }),
    say(message) {
      calls.push(['say', message]);
    },
    registry: {
      resolve(name) {
        if (name === 'gather_wood') {
          return {
            async perform(_, command) {
              calls.push(['gather', command.args.amount]);
              return { ok: true, data: { collected: 12 } };
            }
          };
        }

        if (name === 'deposit') {
          return {
            async perform(_, command) {
              calls.push(['deposit', command.args]);
              return { ok: true, data: { deposited: 12 } };
            }
          };
        }

        return null;
      }
    },
    helpers: {
      ensureReady() {},
      resolveWoodStockTarget(amount) {
        return amount ?? 16;
      },
      async inspectSavedChestWoodStock() {
        const inspection = calls.filter((entry) => entry[0] === 'deposit').length > 0
          ? { count: 16, target: 16, needsRefill: false }
          : { count: 4, target: 16, needsRefill: true, deficit: 12 };
        return inspection;
      },
      stopAllActions() {}
    }
  };

  const result = await maintainWood.execute(context, {
    args: { minimumChestWood: 16, mode: 'run_once' }
  });

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Wood maintenance complete: chest now has 16/16 logs.');
  assert.deepEqual(calls, [
    ['say', 'Wood stock low: 4/16 logs. Restocking 12 logs.'],
    ['gather', 12],
    ['say', 'Heading back to the chest.'],
    ['deposit', { mode: 'wood', amount: 12, target: 'saved' }]
  ]);
});

test('enable_wood_maintenance and disable_wood_maintenance update shared state', async () => {
  const state = createRuntimeState();
  const context = {
    state,
    helpers: {
      resolveWoodStockTarget(amount) {
        return amount ?? 64;
      },
      updateWoodMaintenanceState(patch) {
        return state.setWoodMaintenance(patch);
      }
    }
  };

  const enabled = await enableWoodMaintenance.execute(context, { args: {} });
  const disabled = await disableWoodMaintenance.execute(context, { args: {} });

  assert.equal(enabled.message, 'Wood maintenance enabled at 64 logs.');
  assert.equal(disabled.message, 'Wood maintenance disabled.');
  assert.equal(state.getWoodMaintenance().enabled, false);
});

test('wood_run composes gather and deposit through capability contracts', async () => {
  const taskManager = new TaskManager();
  const calls = [];
  const context = {
    tasks: taskManager,
    say(message) {
      calls.push(['say', message]);
    },
    helpers: {
      stopAllActions() {}
    },
    registry: {
      resolve(name) {
        if (name === 'gather_wood') {
          return {
            async perform(_, command) {
              calls.push(['gather', command.args.amount]);
              return {
                ok: true,
                message: 'Collected 12 logs.',
                data: { collected: 12, complete: true }
              };
            }
          };
        }

        if (name === 'deposit') {
          return {
            async perform(_, command) {
              calls.push(['deposit', command.args]);
              return {
                ok: true,
                message: 'Deposited 12 logs into the saved chest.',
                data: { deposited: 12 }
              };
            }
          };
        }

        return null;
      }
    }
  };

  const result = await woodRun.execute(context, {
    args: { amount: 12 }
  });

  assert.equal(result.ok, true);
  assert.equal(taskManager.getStatus().state, 'idle');
  assert.deepEqual(calls, [
    ['gather', 12],
    ['say', 'Heading back to the saved chest.'],
    ['deposit', { mode: 'wood', amount: 12, target: 'saved' }]
  ]);
});
