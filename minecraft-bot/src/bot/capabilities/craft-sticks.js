const { DEFAULT_CRAFT_STICK_TARGET } = require('../resource-utils');

module.exports = {
  name: 'craft_sticks',
  aliases: ['craft sticks'],
  description: 'Craft sticks from planks.',
  async execute(context, command) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('craft_sticks', command.args || {}, {
        source: command.source || 'command'
      });
    }

    const amount = command.args?.amount ?? DEFAULT_CRAFT_STICK_TARGET;
    return context.tasks.run(
      `crafting ${amount} sticks`,
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.craftSticks(amount, signal);
        return {
          ok: true,
          message: `Crafted ${result.crafted} sticks.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
