module.exports = {
  name: 'inventory',
  description: 'Summarize inventory contents.',
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('inventory', {}, {
        source: 'command'
      });
    }

    return { ok: true, message: context.helpers.inventorySummary() };
  }
};
