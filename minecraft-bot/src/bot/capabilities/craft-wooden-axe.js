module.exports = {
  name: 'craft_wooden_axe',
  aliases: ['craft wooden axe'],
  description: 'Craft a wooden axe into inventory.',
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('craft_wooden_axe', {}, {
        source: 'command'
      });
    }

    return context.tasks.run(
      'crafting wooden axe',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.craftWoodenAxe(signal);
        return {
          ok: true,
          message: `Crafted ${result.crafted} wooden axe.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
