module.exports = {
  name: 'check_wood_stock',
  aliases: ['check wood stock', 'wood stock status'],
  description: 'Inspect the saved chest and report current wood stock.',
  async execute(context, command) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('check_wood_stock', command.args || {}, {
        source: command.source || 'command'
      });
    }

    return context.tasks.run(
      'checking wood stock',
      async ({ signal }) => {
        context.helpers.ensureReady();
        const stock = await context.helpers.inspectSavedChestWoodStock(
          command.args?.minimumChestWood,
          signal
        );

        return {
          ok: true,
          message: context.helpers.woodStockStatusMessage(stock),
          data: { stock }
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
