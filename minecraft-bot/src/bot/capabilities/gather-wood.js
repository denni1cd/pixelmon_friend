const {
  DEFAULT_WOOD_TARGET,
  WOOD_BLOCK_NAMES,
  WOOD_ITEM_NAMES
} = require('../resource-utils');

async function perform(context, command, runtime = {}) {
  if (context.toolRuntime?.executeLegacyCommand) {
    return context.toolRuntime.executeLegacyCommand('gather_wood', command.args || {}, {
      source: runtime.source || 'capability',
      signal: runtime.signal,
      withinTask: true
    });
  }

  const amount = command.args?.amount ?? DEFAULT_WOOD_TARGET;
  return context.helpers.collectResources({
    blockNames: WOOD_BLOCK_NAMES,
    itemNames: WOOD_ITEM_NAMES,
    targetCount: amount,
    announceText: `Getting ${amount} logs.`,
    signal: runtime.signal,
    noun: 'logs'
  });
}

module.exports = {
  name: 'gather_wood',
  aliases: ['wood'],
  description: 'Gather nearby logs.',
  perform,
  async execute(context, command) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('gather_wood', command.args || {}, {
        source: command.source || 'command'
      });
    }

    const amount = command.args?.amount ?? DEFAULT_WOOD_TARGET;
    return context.tasks.run(
      `gathering ${amount} logs`,
      async ({ signal }) => perform(context, command, { signal }),
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
