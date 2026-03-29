module.exports = {
  name: 'drop_all',
  aliases: ['drop all'],
  description: 'Drop every carried item.',
  async execute(context) {
    return context.tasks.run('dropping all items', async () => {
      const stacks = context.bot.inventory.items();
      if (stacks.length === 0) {
        return { ok: false, message: 'Inventory is already empty.' };
      }

      for (const stack of stacks) {
        await context.bot.tossStack(stack);
      }

      return { ok: true, message: 'Dropped everything here.' };
    });
  }
};
