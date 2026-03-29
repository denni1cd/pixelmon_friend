const {
  DEFAULT_STONE_TARGET,
  STONE_BLOCK_NAMES,
  STONE_ITEM_NAMES
} = require('../resource-utils');

module.exports = {
  name: 'gather_stone',
  aliases: ['stone'],
  description: 'Gather nearby stone or cobblestone.',
  async execute(context, command) {
    const amount = command.args?.amount ?? DEFAULT_STONE_TARGET;
    return context.tasks.run(
      `gathering ${amount} stone`,
      async ({ signal }) => context.helpers.collectResources({
        blockNames: STONE_BLOCK_NAMES,
        itemNames: STONE_ITEM_NAMES,
        targetCount: amount,
        announceText: `Getting ${amount} stone.`,
        signal,
        noun: 'stone'
      }),
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
