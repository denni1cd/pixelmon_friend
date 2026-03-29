module.exports = {
  name: 'craft_chest',
  aliases: ['craft chest'],
  description: 'Craft a chest into inventory.',
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('craft_chest', {}, {
        source: 'command'
      });
    }

    return context.tasks.run(
      'crafting chest',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.craftChest(signal);
        return {
          ok: true,
          message: `Crafted ${result.crafted} chest.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
