const test = require('node:test');
const assert = require('node:assert/strict');

const { createRuntimeState } = require('../src/bot/state');
const { TaskManager } = require('../src/bot/task-manager');

test('TaskManager runs and clears a normal task', async () => {
  const state = createRuntimeState();
  const manager = new TaskManager({ state });
  const result = await manager.run('demo task', async () => ({ ok: true, message: 'done' }));

  assert.equal(result.message, 'done');
  assert.equal(manager.getStatus().state, 'idle');
  assert.equal(state.getLastFailure(), null);
  assert.equal(state.getLastOutcome().state, 'completed');
});

test('TaskManager blocks overlapping tasks', async () => {
  const manager = new TaskManager();
  let release;

  const hold = new Promise((resolve) => {
    release = resolve;
  });

  const firstTask = manager.run('first task', async () => {
    await hold;
    return { ok: true, message: 'first done' };
  });

  const secondResult = await manager.run('second task', async () => ({ ok: true, message: 'second done' }));
  assert.equal(secondResult.ok, false);
  assert.equal(secondResult.message, `I'm busy with first task. Say "stop" to cancel it first.`);

  release();
  await firstTask;
});

test('TaskManager cancels a persistent task back to idle', async () => {
  const state = createRuntimeState();
  const manager = new TaskManager({ state });
  await manager.run('following zero', async ({ setPersistent }) => {
    setPersistent({ owner: 'zero' });
    return { ok: true, message: 'Following zero.' };
  });

  assert.equal(manager.getStatus().state, 'persistent');
  const result = await manager.cancel();
  assert.equal(result.message, 'Stopping following zero.');
  assert.equal(manager.getStatus().state, 'idle');
  assert.equal(state.getLastOutcome().state, 'cancelled');
});

test('TaskManager cancel releases busy state even if cleanup hangs', async () => {
  const state = createRuntimeState();
  const manager = new TaskManager({ state });

  await manager.run('following zero', async ({ setPersistent }) => {
    setPersistent({ owner: 'zero' });
    return { ok: true, message: 'Following zero.' };
  }, {
    onCancel: async () => new Promise(() => {})
  });

  const started = Date.now();
  const result = await manager.cancel();
  const elapsed = Date.now() - started;

  assert.equal(result.ok, true);
  assert.equal(result.message, 'Stopping following zero.');
  assert.equal(manager.getStatus().state, 'idle');
  assert.equal(state.getLastOutcome().state, 'cancelled');
  assert.ok(elapsed < 3000);
});

test('TaskManager records last failure and recovers to idle after task errors', async () => {
  const state = createRuntimeState();
  const manager = new TaskManager({ state });

  const result = await manager.run('failing task', async () => {
    throw new Error('boom');
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, 'boom');
  assert.equal(manager.getStatus().state, 'idle');
  assert.deepEqual(state.getLastFailure(), {
    taskName: 'failing task',
    message: 'boom',
    at: state.getLastFailure().at
  });
});

test('TaskManager records recoverable task failures returned as results', async () => {
  const state = createRuntimeState();
  const manager = new TaskManager({ state });

  const result = await manager.run('gathering logs', async () => ({
    ok: false,
    message: "I found nearby logs, but I couldn't reach them."
  }));

  assert.equal(result.ok, false);
  assert.equal(result.message, "I found nearby logs, but I couldn't reach them.");
  assert.equal(manager.getStatus().state, 'idle');
  assert.deepEqual(state.getLastFailure(), {
    taskName: 'gathering logs',
    message: "I found nearby logs, but I couldn't reach them.",
    at: state.getLastFailure().at
  });
  assert.equal(state.getLastOutcome().state, 'failed');
});
