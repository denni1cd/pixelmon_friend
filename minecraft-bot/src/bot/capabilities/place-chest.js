module.exports = {
  name: 'place_chest',
  aliases: ['place chest'],
  description: 'Craft and place a chest nearby, then remember it.',
  async execute(context) {
    return context.tasks.run(
      'placing chest',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        const result = await context.helpers.placeChest({ remember: true, signal });
        return {
          ok: true,
          message: `Placed chest at ${context.helpers.formatSavedPosition(result.position)} and saved it.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
