const test = require('node:test');
const assert = require('node:assert/strict');

const { CapabilityRegistry } = require('../src/bot/capability-registry');

test('CapabilityRegistry resolves names and aliases', () => {
  const registry = new CapabilityRegistry([
    {
      name: 'status',
      aliases: ['health'],
      execute() {}
    }
  ]);

  assert.equal(registry.resolve('status')?.name, 'status');
  assert.equal(registry.resolve('health')?.name, 'status');
  assert.equal(registry.resolve('missing'), null);
});
