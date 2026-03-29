const { DEFAULT_WOOD_TARGET } = require('../resource-utils');

async function perform(context, command, runtime = {}) {
  const amount = command.args?.amount ?? DEFAULT_WOOD_TARGET;
  const gatherCapability = context.registry.resolve('gather_wood');
  const depositCapability = context.registry.resolve('deposit');

  if (!gatherCapability?.perform || !depositCapability?.perform) {
    throw new Error('Wood loop dependencies are not available.');
  }

  const gatherResult = await gatherCapability.perform(context, {
    ...command,
    args: { amount }
  }, runtime);

  if (!gatherResult.ok) {
    return gatherResult;
  }

  const gathered = gatherResult.data?.collected ?? amount;
  if (gathered <= 0) {
    return { ok: false, message: 'I did not gather any logs.', data: null };
  }

  context.say('Heading back to the saved chest.');
  const depositResult = await depositCapability.perform(context, {
    ...command,
    args: { mode: 'wood', amount: gathered, target: 'saved' }
  }, runtime);

  if (!depositResult.ok) {
    return depositResult;
  }

  return {
    ok: true,
    message: `Wood run complete: gathered and deposited ${gathered} logs.`,
    data: { gathered, deposited: depositResult.data?.deposited ?? gathered }
  };
}

module.exports = {
  name: 'wood_run',
  aliases: ['wood run'],
  description: 'Gather wood and deposit it in the remembered chest.',
  perform,
  async execute(context, command) {
    const amount = command.args?.amount ?? DEFAULT_WOOD_TARGET;
    return context.tasks.run(
      `wood run ${amount}`,
      async ({ signal }) => perform(context, command, { signal }),
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
