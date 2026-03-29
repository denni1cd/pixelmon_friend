async function perform(context) {
  if (context.toolRuntime?.executeLegacyCommand) {
    return context.toolRuntime.executeLegacyCommand('go_home', {}, {
      source: 'capability'
    });
  }

  context.helpers.ensureReady();

  const home = context.helpers.savedHomePosition();
  if (!home) {
    return { ok: false, message: 'Home is not set yet.', data: null };
  }

  await context.helpers.goToSavedPosition(home, 1);
  return {
    ok: true,
    message: `Back home at ${context.helpers.formatSavedPosition(home)}.`,
    data: { homePosition: home }
  };
}

module.exports = {
  name: 'go_home',
  aliases: ['go home'],
  description: 'Return to the remembered home position.',
  perform,
  async execute(context) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('go_home', {}, {
        source: 'command'
      });
    }

    return context.tasks.run(
      'going home',
      async ({ signal } = {}) => {
        context.helpers.ensureReady();

        const home = context.helpers.savedHomePosition();
        if (!home) {
          return { ok: false, message: 'Home is not set yet.', data: null };
        }

        await context.helpers.goToSavedPosition(home, 1, signal);
        return {
          ok: true,
          message: `Back home at ${context.helpers.formatSavedPosition(home)}.`,
          data: { homePosition: home }
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
