module.exports = {
  name: 'where_home',
  aliases: ['where is home'],
  description: 'Report the remembered home location.',
  async execute(context) {
    const home = context.helpers.savedHomePosition();
    if (!home) {
      return { ok: false, message: 'Home is not set yet.', data: null };
    }

    return {
      ok: true,
      message: `Home is ${context.helpers.formatSavedPosition(home)}.`,
      data: { homePosition: home }
    };
  }
};
