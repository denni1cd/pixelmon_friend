const test = require('node:test');
const assert = require('node:assert/strict');

const gatherWood = require('../src/bot/capabilities/gather-wood');
const { TaskManager } = require('../src/bot/task-manager');
const { WOOD_BLOCK_NAMES, WOOD_ITEM_NAMES } = require('../src/bot/resource-utils');

test('gather_wood delegates to collectResources with wood selectors', async () => {
  const calls = [];
  const context = {
    tasks: new TaskManager(),
    helpers: {
      async collectResources(options) {
        calls.push(options);
        return { ok: true, message: 'Collected 4 logs.' };
      },
      async stopAllActions() {}
    }
  };

  const result = await gatherWood.execute(context, { args: { amount: 4 } });

  assert.equal(result.message, 'Collected 4 logs.');
  assert.deepEqual(calls[0].blockNames, WOOD_BLOCK_NAMES);
  assert.deepEqual(calls[0].itemNames, WOOD_ITEM_NAMES);
  assert.equal(calls[0].targetCount, 4);
});
