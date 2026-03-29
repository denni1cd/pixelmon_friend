const { parseChatCommand } = require('./command-parser');
const { catalogForPrompt, normalizeIntentPayload } = require('./intent-catalog');

function confirmationForIntent(intent) {
  const amount = intent.args?.amount;

  switch (intent.action) {
    case 'gather_wood':
      return `Getting ${amount} wood.`;
    case 'wood_run':
      return `Getting ${amount} wood and bringing it back to the chest.`;
    case 'cobble_run':
      return `Getting ${amount} cobblestone and bringing it back to the chest.`;
    case 'deposit':
      if (intent.args?.mode === 'wood') {
        return 'Putting my wood in the chest.';
      }

      if (intent.args?.mode === 'stone') {
        return 'Putting my cobblestone in the chest.';
      }

      if (intent.args?.mode === 'equipment') {
        return 'Putting my equipment in the chest.';
      }

      return 'Putting everything in the chest.';
    case 'check_wood_stock':
      return 'Checking the wood chest.';
    case 'maintain_wood':
      return `Checking whether the chest needs ${intent.args?.minimumChestWood} logs.`;
    case 'enable_wood_maintenance':
      return 'Enabling wood maintenance.';
    case 'disable_wood_maintenance':
      return 'Disabling wood maintenance.';
    case 'go_home':
      return 'Going home.';
    case 'inventory':
      return 'Checking what I am carrying.';
    case 'status':
      return 'Checking what I am doing.';
    case 'craft_planks':
      return `Crafting ${amount} planks.`;
    case 'craft_sticks':
      return `Crafting ${amount} sticks.`;
    case 'craft_crafting_table':
      return 'Crafting a crafting table.';
    case 'craft_chest':
      return 'Crafting a chest.';
    case 'craft_wooden_axe':
      return 'Crafting a wooden axe.';
    case 'craft_wooden_pickaxe':
      return 'Crafting a wooden pickaxe.';
    case 'craft_stone_axe':
      return 'Crafting a stone axe.';
    case 'craft_stone_pickaxe':
      return 'Crafting a stone pickaxe.';
    default:
      return 'Starting that task.';
  }
}

async function classifyChatMessage(context, { username, message }) {
  const exactCommand = parseChatCommand(message);
  if (exactCommand.matched) {
    context.logger?.info?.('chat.route.exact_command', {
      username,
      commandName: exactCommand.name
    });
    return { type: 'exact_command', command: exactCommand };
  }

  let payload;
  try {
    payload = await context.lmStudio.classifyIntent(message, username, catalogForPrompt());
  } catch (error) {
    context.logger?.warn?.('chat.route.intent_classify_failed', {
      username,
      message: error.message || String(error)
    });
    return {
      type: 'refusal',
      message: "I couldn't interpret that request right now. Try an exact command."
    };
  }

  const normalized = normalizeIntentPayload(payload);
  if (!normalized.ok) {
    context.logger?.warn?.('chat.route.invalid_intent', {
      username,
      reason: normalized.reason || 'unknown',
      key: normalized.key || null
    });
    return {
      type: 'refusal',
      message: normalized.message
    };
  }

  if (normalized.type === 'conversation') {
    context.logger?.info?.('chat.route.conversation', { username });
    return { type: 'conversation' };
  }

  if (normalized.type === 'refusal') {
    context.logger?.info?.('chat.route.refusal', {
      username,
      message: normalized.message
    });
    return { type: 'refusal', message: normalized.message };
  }

  context.logger?.info?.('chat.route.intent', {
    username,
    action: normalized.intent.action,
    args: normalized.intent.args
  });
  return {
    type: 'intent',
    intent: normalized.intent,
    confirmation: confirmationForIntent(normalized.intent)
  };
}

module.exports = {
  classifyChatMessage,
  confirmationForIntent
};
