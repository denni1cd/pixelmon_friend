const { goals } = require('mineflayer-pathfinder');

module.exports = {
  name: 'follow',
  description: 'Follow the issuing player.',
  async execute(context, command) {
    const target = context.bot.players[command.username]?.entity;
    if (!target) {
      return { ok: false, message: "I can't see you." };
    }

    return context.tasks.run(
      `following ${command.username}`,
      async ({ setPersistent }) => {
        context.helpers.ensureReady();
        context.bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true);
        setPersistent({ owner: command.username, type: 'follow' });
        return { ok: true, message: `Following ${command.username}.` };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
