module.exports = {
  name: 'craft_status',
  aliases: ['craft status'],
  description: 'Report current crafting readiness.',
  async execute(context) {
    return {
      ok: true,
      message: context.helpers.craftStatusSummary(),
      data: null
    };
  }
};
