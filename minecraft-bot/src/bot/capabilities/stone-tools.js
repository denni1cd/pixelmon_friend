async function perform(context, runtime = {}) {
  context.helpers.ensureReady();

  const crafted = [];

  try {
    if (!context.helpers.findInventoryItem(['stone_pickaxe'])) {
      await context.helpers.craftStonePickaxe(runtime.signal);
      crafted.push('stone pickaxe');
    }

    if (!context.helpers.findInventoryItem(['stone_axe'])) {
      await context.helpers.craftStoneAxe(runtime.signal);
      crafted.push('stone axe');
    }
  } catch (error) {
    if (crafted.length > 0) {
      return {
        ok: false,
        message: `Crafted ${crafted.join(' and ')}, but couldn't finish: ${error.message}`,
        data: { crafted }
      };
    }

    throw error;
  }

  if (crafted.length === 0) {
    return {
      ok: true,
      message: 'Stone tools are already ready.',
      data: { crafted: [] }
    };
  }

  return {
    ok: true,
    message: `Crafted ${crafted.join(' and ')}.`,
    data: { crafted }
  };
}

module.exports = {
  name: 'stone_tools',
  aliases: ['stone tools'],
  description: 'Craft missing supported stone tools.',
  perform,
  async execute(context) {
    return context.tasks.run(
      'crafting stone tools',
      async ({ signal } = {}) => perform(context, { signal }),
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
