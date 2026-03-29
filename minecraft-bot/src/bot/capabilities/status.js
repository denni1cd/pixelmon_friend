module.exports = {
  name: 'status',
  description: 'Report active task and position.',
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('status', {}, {
        source: 'command'
      });
    }

    return {
      ok: true,
      message: context.helpers.statusSummary(),
      data: {
        state: context.state.getSnapshot?.() || null,
        task: context.tasks.getStatus?.() || null
      }
    };
  }
};
