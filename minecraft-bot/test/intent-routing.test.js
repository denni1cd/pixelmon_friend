const test = require('node:test');
const assert = require('node:assert/strict');

const { classifyChatMessage, confirmationForIntent } = require('../src/bot/intent-router');
const { normalizeIntentPayload } = require('../src/bot/intent-catalog');

test('normalizeIntentPayload accepts a valid task and fills deterministic defaults', () => {
  const result = normalizeIntentPayload({
    kind: 'task',
    action: 'wood_run',
    args: {}
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.intent, {
    action: 'wood_run',
    args: { amount: 8 }
  });
});

test('normalizeIntentPayload accepts maintain_wood and fills deterministic defaults', () => {
  const result = normalizeIntentPayload({
    kind: 'task',
    action: 'maintain_wood',
    args: {}
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.intent, {
    action: 'maintain_wood',
    args: { minimumChestWood: 64, mode: 'run_once' }
  });
});

test('normalizeIntentPayload rejects unsupported actions', () => {
  const result = normalizeIntentPayload({
    kind: 'task',
    action: 'fight_mobs',
    args: {}
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, "I can't do that yet.");
});

test('normalizeIntentPayload refuses malformed args', () => {
  const result = normalizeIntentPayload({
    kind: 'task',
    action: 'craft_planks',
    args: { amount: 'lots' }
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, 'That count needs to be a positive number.');
  assert.equal(result.reason, 'invalid_count');
});

test('classifyChatMessage keeps exact commands ahead of the LLM path', async () => {
  const context = {
    lmStudio: {
      async classifyIntent() {
        assert.fail('classifyIntent should not run for exact commands');
      }
    }
  };

  const result = await classifyChatMessage(context, {
    username: 'Zero',
    message: 'wood 16'
  });

  assert.equal(result.type, 'exact_command');
  assert.equal(result.command.name, 'gather_wood');
});

test('classifyChatMessage routes conversation separately from task intents', async () => {
  const context = {
    lmStudio: {
      async classifyIntent() {
        return { kind: 'conversation' };
      }
    }
  };

  const result = await classifyChatMessage(context, {
    username: 'Zero',
    message: 'how is it going'
  });

  assert.deepEqual(result, { type: 'conversation' });
});

test('classifyChatMessage returns a confirmed validated intent for task requests', async () => {
  const context = {
    lmStudio: {
      async classifyIntent() {
        return {
          kind: 'task',
          action: 'cobble_run',
          args: { amount: 16 }
        };
      }
    }
  };

  const result = await classifyChatMessage(context, {
    username: 'Zero',
    message: 'stock the chest with cobble'
  });

  assert.equal(result.type, 'intent');
  assert.deepEqual(result.intent, {
    action: 'cobble_run',
    args: { amount: 16 }
  });
  assert.equal(result.confirmation, 'Getting 16 cobblestone and bringing it back to the chest.');
});

test('classifyChatMessage refuses unsupported or invalid intent payloads', async () => {
  const context = {
    lmStudio: {
      async classifyIntent() {
        return {
          kind: 'unsupported',
          message: 'I cannot help with combat.'
        };
      }
    }
  };

  const result = await classifyChatMessage(context, {
    username: 'Zero',
    message: 'go kill mobs for me'
  });

  assert.deepEqual(result, {
    type: 'refusal',
    message: 'I cannot help with combat.'
  });
});

test('classifyChatMessage falls back safely when LM Studio intent parsing fails', async () => {
  const context = {
    lmStudio: {
      async classifyIntent() {
        throw new Error('LM Studio unavailable');
      }
    }
  };

  const originalError = console.error;
  console.error = () => {};

  const result = await classifyChatMessage(context, {
    username: 'Zero',
    message: 'go get some wood for us'
  });

  console.error = originalError;

  assert.deepEqual(result, {
    type: 'refusal',
    message: "I couldn't interpret that request right now. Try an exact command."
  });
});

test('confirmationForIntent renders concise player-facing task confirmations', () => {
  assert.equal(
    confirmationForIntent({ action: 'craft_stone_pickaxe', args: {} }),
    'Crafting a stone pickaxe.'
  );

  assert.equal(
    confirmationForIntent({ action: 'maintain_wood', args: { minimumChestWood: 64 } }),
    'Checking whether the chest needs 64 logs.'
  );
});
