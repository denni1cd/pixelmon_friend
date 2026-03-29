const { goals } = require('mineflayer-pathfinder');

module.exports = {
  name: 'come_here',
  aliases: ['come here'],
  description: 'Walk to the issuing player.',
  async execute(context, command) {
    const target = context.bot.players[command.username]?.entity;
    if (!target) {
      return { ok: false, message: "I can't find you." };
    }

    const position = target.position.clone();
    return context.tasks.run(
      `going to ${command.username}`,
      async () => {
        context.helpers.ensureReady();
        context.say('On my way.');
        await context.bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, 1));
        return { ok: true, message: `Reached ${command.username}.` };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
