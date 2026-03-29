const { goals } = require('mineflayer-pathfinder');

module.exports = {
  name: 'goto',
  description: 'Walk to explicit coordinates.',
  async execute(context, command) {
    const { x, y, z } = command.args || {};
    if (![x, y, z].every((value) => Number.isFinite(value))) {
      return { ok: false, message: 'Use something like: goto 10 64 -3' };
    }

    return context.tasks.run(
      `going to ${x} ${y} ${z}`,
      async () => {
        context.helpers.ensureReady();
        context.say(`Heading to ${x} ${y} ${z}.`);
        await context.bot.pathfinder.goto(new goals.GoalNear(x, y, z, 1));
        return { ok: true, message: `Reached ${x} ${y} ${z}.` };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
