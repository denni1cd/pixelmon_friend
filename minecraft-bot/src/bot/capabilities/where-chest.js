module.exports = {
  name: 'where_chest',
  aliases: ['where is chest'],
  description: 'Report the remembered chest location.',
  async execute(context) {
    const chest = context.helpers.savedChestPosition();
    if (!chest) {
      return { ok: false, message: 'Chest is not set yet.', data: null };
    }

    return {
      ok: true,
      message: `Chest is ${context.helpers.formatSavedPosition(chest)}.`,
      data: { chestPosition: chest }
    };
  }
};
