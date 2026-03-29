const test = require('node:test');
const assert = require('node:assert/strict');

const { handlePlayerMessage } = require('../src/bot/chat-runtime');

function createContext(overrides = {}) {
  const said = [];
  return {
    said,
    say(message) {
      said.push(message);
    },
    lmStudio: {
      async classifyIntent() {
        return { kind: 'conversation' };
      },
      async ask(message) {
        return `chat:${message}`;
      }
    },
    registry: {
      resolve(name) {
        return {
          async execute(_, command) {
            return {
              ok: true,
              message: `ran:${name}:${JSON.stringify(command.args || {})}`
            };
          }
        };
      }
    },
    tasks: {
      isBusy() {
        return false;
      },
      getStatus() {
        return { state: 'idle', taskName: null };
      }
    },
    ...overrides
  };
}

test('handlePlayerMessage executes exact commands without the LLM path', async () => {
  const context = createContext({
    lmStudio: {
      async classifyIntent() {
        assert.fail('classifyIntent should not run for exact commands');
      },
      async ask() {
        assert.fail('ask should not run for exact commands');
      }
    }
  });

  const result = await handlePlayerMessage(context, {
    username: 'Zero',
    message: 'wood 12'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(context.said, ['ran:gather_wood:{"amount":12}']);
});

test('handlePlayerMessage routes validated intents through the registry with confirmation', async () => {
  const seen = [];
  const context = createContext({
    lmStudio: {
      async classifyIntent() {
        return {
          kind: 'task',
          action: 'craft_stone_pickaxe',
          args: {}
        };
      },
      async ask() {
        assert.fail('ask should not run for validated task intents');
      }
    },
    registry: {
      resolve(name) {
        return {
          async execute(_, command) {
            seen.push([name, command.source]);
            return { ok: true, message: 'done' };
          }
        };
      }
    }
  });

  const result = await handlePlayerMessage(context, {
    username: 'Zero',
    message: 'make me a stone pickaxe'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(seen, [['craft_stone_pickaxe', 'intent']]);
  assert.deepEqual(context.said, ['Crafting a stone pickaxe.', 'done']);
});

test('handlePlayerMessage preserves ordinary conversation replies', async () => {
  const context = createContext();
  const result = await handlePlayerMessage(context, {
    username: 'Zero',
    message: 'how is it going'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(context.said, ['chat:how is it going']);
});

test('handlePlayerMessage refuses unsupported natural-language requests safely', async () => {
  const context = createContext({
    lmStudio: {
      async classifyIntent() {
        return {
          kind: 'unsupported',
          message: "I can't help with that yet."
        };
      },
      async ask() {
        assert.fail('ask should not run for unsupported requests');
      }
    }
  });

  const result = await handlePlayerMessage(context, {
    username: 'Zero',
    message: 'build us a castle'
  });

  assert.equal(result.ok, false);
  assert.deepEqual(context.said, ["I can't help with that yet."]);
});

test('handlePlayerMessage falls back safely when ordinary conversation reply fails', async () => {
  const context = createContext({
    lmStudio: {
      async classifyIntent() {
        return { kind: 'conversation' };
      },
      async ask() {
        throw new Error('LM Studio unavailable');
      }
    }
  });

  const originalError = console.error;
  console.error = () => {};

  const result = await handlePlayerMessage(context, {
    username: 'Zero',
    message: 'hello'
  });

  console.error = originalError;

  assert.equal(result.ok, false);
  assert.deepEqual(context.said, ["I couldn't chat right now."]);
});

test('handlePlayerMessage refuses new work while a task is already active', async () => {
  const context = createContext({
    tasks: {
      isBusy() {
        return true;
      },
      getStatus() {
        return { state: 'running', taskName: 'wood run 16' };
      }
    }
  });

  const result = await handlePlayerMessage(context, {
    username: 'Zero',
    message: 'wood 12'
  });

  assert.equal(result.ok, false);
  assert.deepEqual(context.said, [`I'm busy with wood run 16. Say "stop" to cancel it first.`]);
});

test('handlePlayerMessage still allows status checks while busy', async () => {
  const context = createContext({
    tasks: {
      isBusy() {
        return true;
      },
      getStatus() {
        return { state: 'running', taskName: 'wood run 16' };
      }
    }
  });

  const result = await handlePlayerMessage(context, {
    username: 'Zero',
    message: 'status'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(context.said, ['ran:status:{}']);
});
