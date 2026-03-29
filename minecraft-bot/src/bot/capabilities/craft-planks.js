const { DEFAULT_CRAFT_PLANK_TARGET } = require('../resource-utils');

module.exports = {
  name: 'craft_planks',
  aliases: ['craft planks'],
  description: 'Craft planks from logs.',
  async execute(context, command) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('craft_planks', command.args || {}, {
        source: command.source || 'command'
      });
    }

    const amount = command.args?.amount ?? DEFAULT_CRAFT_PLANK_TARGET;
    return context.tasks.run(
      `crafting ${amount} planks`,
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.craftPlanks(amount, signal);
        return {
          ok: true,
          message: `Crafted ${result.crafted} planks.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
