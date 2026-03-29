module.exports = {
  name: 'craft_stone_axe',
  aliases: ['craft stone axe'],
  description: 'Craft a stone axe into inventory.',
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('craft_stone_axe', {}, {
        source: 'command'
      });
    }

    return context.tasks.run(
      'crafting stone axe',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.craftStoneAxe(signal);
        return {
          ok: true,
          message: `Crafted ${result.crafted} stone axe.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
