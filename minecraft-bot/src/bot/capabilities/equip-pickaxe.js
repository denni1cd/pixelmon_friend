module.exports = {
  name: 'equip_pickaxe',
  aliases: ['equip pickaxe'],
  description: 'Equip the best available pickaxe.',
  async execute(context) {
    return context.tasks.run(
      'equipping pickaxe',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        if (signal?.aborted) {
          throw new Error('Task cancelled.');
        }
        const result = await context.helpers.equipPreferredTool('pickaxe', { required: true });
        return {
          ok: true,
          message: `Equipped ${result.displayName}.`,
          data: result
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
