module.exports = {
  name: 'craft_stone_pickaxe',
  aliases: ['craft stone pickaxe'],
  description: 'Craft a stone pickaxe into inventory.',
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('craft_stone_pickaxe', {}, {
        source: 'command'
      });
    }

    return context.tasks.run(
      'crafting stone pickaxe',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.craftStonePickaxe(signal);
        return {
          ok: true,
          message: `Crafted ${result.crafted} stone pickaxe.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
