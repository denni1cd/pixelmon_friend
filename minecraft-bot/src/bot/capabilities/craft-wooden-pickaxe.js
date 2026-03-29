module.exports = {
  name: 'craft_wooden_pickaxe',
  aliases: ['craft wooden pickaxe'],
  description: 'Craft a wooden pickaxe into inventory.',
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('craft_wooden_pickaxe', {}, {
        source: 'command'
      });
    }

    return context.tasks.run(
      'crafting wooden pickaxe',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.craftWoodenPickaxe(signal);
        return {
          ok: true,
          message: `Crafted ${result.crafted} wooden pickaxe.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
