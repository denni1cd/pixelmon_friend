const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_WOOD_TARGET,
  parseCountCommand,
  planChestResources,
  plankNameForLog
} = require('../wood-utils');

test('parseCountCommand uses the default amount when no explicit amount is given', () => {
  assert.deepEqual(
    parseCountCommand('stash wood', 'stash wood'),
    { matched: true, amount: DEFAULT_WOOD_TARGET, error: null }
  );
});

test('parseCountCommand accepts an explicit amount', () => {
  assert.deepEqual(
    parseCountCommand('stash wood 12', 'stash wood'),
    { matched: true, amount: 12, error: null }
  );
});

test('parseCountCommand rejects invalid amounts', () => {
  assert.deepEqual(
    parseCountCommand('stash wood nope', 'stash wood'),
    { matched: true, amount: null, error: 'Use something like: stash wood 8' }
  );
});

test('planChestResources requires no extra logs when nearby storage already exists', () => {
  assert.equal(
    planChestResources({
      hasNearbyChest: true,
      hasChestItem: false,
      hasNearbyCraftingTable: false,
      hasCraftingTableItem: false,
      plankCount: 0,
      logCount: 0
    }).extraLogsNeeded,
    0
  );
});

test('planChestResources accounts for crafting table and chest overhead', () => {
  assert.deepEqual(
    planChestResources({
      hasNearbyChest: false,
      hasChestItem: false,
      hasNearbyCraftingTable: false,
      hasCraftingTableItem: false,
      plankCount: 0,
      logCount: 0
    }),
    {
      hasStorageAccess: false,
      hasCraftingTableAccess: false,
      requiredPlanks: 12,
      availablePlanksEquivalent: 0,
      missingPlanks: 12,
      extraLogsNeeded: 3
    }
  );
});

test('planChestResources reuses existing logs and planks before requesting more wood', () => {
  assert.equal(
    planChestResources({
      hasNearbyChest: false,
      hasChestItem: false,
      hasNearbyCraftingTable: true,
      hasCraftingTableItem: false,
      plankCount: 3,
      logCount: 1
    }).extraLogsNeeded,
    1
  );
});

test('plankNameForLog maps wood logs to matching planks', () => {
  assert.equal(plankNameForLog('dark_oak_log'), 'dark_oak_planks');
});
