const test = require('node:test');
const assert = require('node:assert/strict');

const { createHelpers } = require('../src/bot/helpers');

function createBlock(name, x, y, z) {
  return {
    name,
    position: { x, y, z }
  };
}

test('collectResources skips a timed-out target and keeps trying nearby blocks', async () => {
  const firstBlock = createBlock('oak_log', 1, 64, 1);
  const secondBlock = createBlock('oak_log', 2, 64, 2);
  const collected = [];
  let inventoryCount = 0;

  const context = {
    mcData: {},
    say() {},
    bot: {
      inventory: {
        items() {
          return inventoryCount > 0 ? [{ name: 'oak_log', count: inventoryCount }] : [];
        }
      },
      findBlocks() {
        return [firstBlock.position, secondBlock.position];
      },
      blockAt(position) {
        if (position === firstBlock.position) {
          return firstBlock;
        }

        if (position === secondBlock.position) {
          return secondBlock;
        }

        return null;
      },
      collectBlock: {
        async collect(block) {
          collected.push(block.position);
          if (block === firstBlock) {
            throw new Error('Took too long to decide path to goal!');
          }

          inventoryCount += 1;
        }
      }
    }
  };

  const helpers = createHelpers(context);
  const result = await helpers.collectResources({
    blockNames: ['oak_log'],
    itemNames: ['oak_log'],
    targetCount: 1,
    noun: 'logs'
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.collected, 1);
  assert.deepEqual(collected, [firstBlock.position, secondBlock.position]);
});

test('collectResources reports unreachable resources cleanly after exhausting candidates', async () => {
  const firstBlock = createBlock('oak_log', 1, 64, 1);
  const secondBlock = createBlock('oak_log', 2, 64, 2);

  const context = {
    mcData: {},
    say() {},
    bot: {
      inventory: {
        items() {
          return [];
        }
      },
      findBlocks() {
        return [firstBlock.position, secondBlock.position];
      },
      blockAt(position) {
        if (position === firstBlock.position) {
          return firstBlock;
        }

        if (position === secondBlock.position) {
          return secondBlock;
        }

        return null;
      },
      collectBlock: {
        async collect() {
          throw new Error('No path to the goal');
        }
      }
    }
  };

  const helpers = createHelpers(context);
  const result = await helpers.collectResources({
    blockNames: ['oak_log'],
    itemNames: ['oak_log'],
    targetCount: 1,
    noun: 'logs'
  });

  assert.deepEqual(result, {
    ok: false,
    message: "I found nearby logs, but I couldn't reach them.",
    data: { collected: 0, complete: false, unreachable: true }
  });
});

test('collectResources scouts toward a high target before giving up on it', async () => {
  const highBlock = createBlock('oak_log', 8, 68, 8);
  const scaffoldBlock = createBlock('dirt', 2, 64, 2);
  const calls = [];
  let inventoryCount = 0;
  let scaffoldCount = 0;

  const context = {
    mcData: {},
    say() {},
    bot: {
      entity: {
        position: { x: 0, y: 64, z: 0 }
      },
      inventory: {
        items() {
          const items = [];
          if (inventoryCount > 0) {
            items.push({ name: 'oak_log', count: inventoryCount });
          }
          if (scaffoldCount > 0) {
            items.push({ name: 'dirt', count: scaffoldCount });
          }
          return items;
        }
      },
      findBlocks() {
        return [highBlock.position, scaffoldBlock.position];
      },
      findBlock() {
        return highBlock;
      },
      blockAt(position) {
        if (position === highBlock.position) {
          return highBlock;
        }

        if (position === scaffoldBlock.position) {
          return scaffoldBlock;
        }

        return null;
      },
      pathfinder: {
        async goto(goal) {
          calls.push(['goto', goal.x, goal.y, goal.z, goal.range]);
        }
      },
      collectBlock: {
        async collect(block) {
          calls.push(['collect', block.position.x, block.position.y, block.position.z]);
          const highCollects = calls.filter((entry) => entry[0] === 'collect' && entry[1] === 8);
          if (block === highBlock && highCollects.length === 1) {
            throw new Error('Took too long to decide path to goal!');
          }

          if (block === highBlock) {
            inventoryCount += 1;
          } else if (block === scaffoldBlock) {
            scaffoldCount = 4;
          }
        }
      }
    }
  };

  const helpers = createHelpers(context);
  const result = await helpers.collectResources({
    blockNames: ['oak_log'],
    itemNames: ['oak_log'],
    targetCount: 1,
    noun: 'logs'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    ['collect', 2, 64, 2],
    ['collect', 8, 68, 8],
    ['goto', 8, 68, 8, undefined],
    ['collect', 8, 68, 8]
  ]);
});

test('stopAllActions clears pathing, controls, and collect tasks', async () => {
  const calls = [];
  const context = {
    mcData: {},
    say() {},
    bot: {
      pathfinder: {
        setGoal(goal) {
          calls.push(['setGoal', goal]);
        }
      },
      clearControlStates() {
        calls.push(['clearControlStates']);
      },
      collectBlock: {
        async cancelTask() {
          calls.push(['cancelTask']);
        }
      }
    }
  };

  const helpers = createHelpers(context);
  await helpers.stopAllActions();

  assert.deepEqual(calls, [
    ['setGoal', null],
    ['clearControlStates'],
    ['cancelTask']
  ]);
});
