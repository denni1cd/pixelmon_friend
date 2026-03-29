module.exports = {
  name: 'equip_axe',
  aliases: ['equip axe'],
  description: 'Equip the best available axe.',
  async execute(context) {
    return context.tasks.run(
      'equipping axe',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();
        if (signal?.aborted) {
          throw new Error('Task cancelled.');
        }
        const result = await context.helpers.equipPreferredTool('axe', { required: true });
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
