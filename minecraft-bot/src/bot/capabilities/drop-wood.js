const { WOOD_ITEM_NAMES } = require('../resource-utils');

module.exports = {
  name: 'drop_wood',
  aliases: ['drop wood', 'pile wood'],
  description: 'Drop all carried wood.',
  async execute(context) {
    return context.tasks.run('dropping wood', async () => {
      const woodStacks = context.bot.inventory.items()
        .filter((item) => WOOD_ITEM_NAMES.includes(item.name));

      if (woodStacks.length === 0) {
        return { ok: false, message: "I don't have any wood." };
      }

      for (const stack of woodStacks) {
        await context.bot.tossStack(stack);
      }

      return { ok: true, message: 'Dropped all wood here.' };
    });
  }
};
