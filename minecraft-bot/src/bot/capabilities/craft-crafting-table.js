module.exports = {
  name: 'craft_crafting_table',
  aliases: ['craft crafting table'],
  description: 'Craft a crafting table into inventory.',
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('craft_crafting_table', {}, {
        source: 'command'
      });
    }

    return context.tasks.run(
      'crafting crafting table',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.craftCraftingTable(signal);
        return {
          ok: true,
          message: `Crafted ${result.crafted} crafting table.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
