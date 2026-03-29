const test = require('node:test');
const assert = require('node:assert/strict');

const { createHelpers } = require('../src/bot/helpers');
const { createRuntimeState } = require('../src/bot/state');

test('statusSummary includes task memory, saved positions, tools, and last failure', () => {
  const state = createRuntimeState();
  state.setHomePosition({ x: 1, y: 64, z: 2, dimension: 'minecraft:overworld' });
  state.setChestPosition({ x: 3, y: 64, z: 4, dimension: 'minecraft:overworld' });
  state.setCraftingTablePosition({ x: 5, y: 64, z: 6, dimension: 'minecraft:overworld' });
  state.setPreferredTool('axe', 'stone_axe');
  state.setPreferredTool('pickaxe', 'stone_pickaxe');
  state.setWoodMaintenance({
    enabled: true,
    minimumChestWood: 64
  });
  state.setTaskStatus({
    state: 'running',
    taskName: 'wood run 16',
    startedAt: '2026-03-26T13:30:00.000Z',
    details: null,
    persistent: false,
    cancellable: true
  });
  state.setLastFailure({
    taskName: 'depositing items',
    message: 'Saved chest is missing or is no longer a chest.',
    at: '2026-03-26T13:31:00.000Z'
  });

  const helpers = createHelpers({
    state,
    tasks: {
      getStatus() {
        return state.getTaskStatus();
      }
    },
    bot: {
      entity: {
        position: { x: 10, y: 65, z: 11 }
      },
      inventory: {
        items() {
          return [];
        }
      }
    }
  });

  assert.equal(
    helpers.statusSummary(),
    'Status: running wood run 16. Pos 10 65 11. Home 1 64 2 (minecraft:overworld). Chest 3 64 4 (minecraft:overworld). Table 5 64 6 (minecraft:overworld). Axe stone axe. Pickaxe stone pickaxe. Wood maintenance on 64. Last failure: depositing items: Saved chest is missing or is no longer a chest.'
  );
});
