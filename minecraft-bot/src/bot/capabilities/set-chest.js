module.exports = {
  name: 'set_chest',
  aliases: ['set chest'],
  description: 'Remember a chest target for future deposits.',
  async execute(context) {
    context.helpers.ensureReady();

    const { position } = context.helpers.saveChestPosition();
    return {
      ok: true,
      message: `Chest saved at ${context.helpers.formatSavedPosition(position)}.`,
      data: { chestPosition: position }
    };
  }
};
