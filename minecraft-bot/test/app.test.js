const test = require('node:test');
const assert = require('node:assert/strict');

const { sanitizeChatMessage, MAX_CHAT_MESSAGE_LENGTH } = require('../src/bot/app');

test('sanitizeChatMessage collapses whitespace for safe chat output', () => {
  assert.equal(
    sanitizeChatMessage('  hello\nthere\tfriend  '),
    'hello there friend'
  );
});

test('sanitizeChatMessage truncates oversized chat output', () => {
  const input = 'x'.repeat(MAX_CHAT_MESSAGE_LENGTH + 25);
  const output = sanitizeChatMessage(input);

  assert.equal(output.length, MAX_CHAT_MESSAGE_LENGTH);
  assert.equal(output.endsWith('...'), true);
});

test('sanitizeChatMessage ignores non-string output safely', () => {
  assert.equal(sanitizeChatMessage(null), '');
});
