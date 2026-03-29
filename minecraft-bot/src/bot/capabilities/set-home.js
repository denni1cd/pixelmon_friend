module.exports = {
  name: 'set_home',
  aliases: ['set home'],
  description: 'Remember the current position as home.',
  async execute(context) {
    context.helpers.ensureReady();

    const home = context.helpers.saveHomePosition();
    return {
      ok: true,
      message: `Home saved at ${context.helpers.formatSavedPosition(home)}.`,
      data: { homePosition: home }
    };
  }
};
