module.exports = {
  name: 'place_crafting_table',
  aliases: ['place crafting table'],
  description: 'Craft and place a crafting table nearby if needed.',
  async execute(context) {
    return context.tasks.run(
      'placing crafting table',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.placeCraftingTable({ remember: true, signal });
        return {
          ok: true,
          message: `Placed crafting table at ${context.helpers.formatSavedPosition(result.position)} and saved it.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
