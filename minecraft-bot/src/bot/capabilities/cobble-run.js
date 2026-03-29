const {
  COBBLE_ITEM_NAMES,
  COBBLE_SOURCE_BLOCK_NAMES,
  DEFAULT_COBBLE_TARGET
} = require('../resource-utils');

async function perform(context, command, runtime = {}) {
  const amount = command.args?.amount ?? DEFAULT_COBBLE_TARGET;
  const depositCapability = context.registry.resolve('deposit');

  if (!depositCapability?.perform) {
    throw new Error('Stone deposit is not available.');
  }

  await context.helpers.ensureToolForRole('pickaxe', runtime.signal);
  await context.helpers.equipPreferredTool('pickaxe', { required: true });

  const gatherResult = await context.helpers.collectResources({
    blockNames: COBBLE_SOURCE_BLOCK_NAMES,
    itemNames: COBBLE_ITEM_NAMES,
    targetCount: amount,
    announceText: `Getting ${amount} cobblestone.`,
    signal: runtime.signal,
    noun: 'cobblestone'
  });

  if (!gatherResult.ok) {
    return gatherResult;
  }

  const gathered = gatherResult.data?.collected ?? amount;
  if (gathered <= 0) {
    return { ok: false, message: 'I did not gather any cobblestone.', data: null };
  }

  context.say('Heading back to the saved chest.');
  const depositResult = await depositCapability.perform(context, {
    ...command,
    args: { mode: 'stone', amount: gathered, target: 'saved' }
  }, runtime);

  if (!depositResult.ok) {
    return {
      ok: false,
      message: `Gathered ${gathered} cobblestone, but deposit failed: ${depositResult.message}`,
      data: { gathered, deposited: depositResult.data?.deposited ?? 0 }
    };
  }

  return {
    ok: true,
    message: `Cobble run complete: gathered and deposited ${gathered} cobblestone.`,
    data: { gathered, deposited: depositResult.data?.deposited ?? gathered }
  };
}

module.exports = {
  name: 'cobble_run',
  aliases: ['cobble'],
  description: 'Gather cobblestone and deposit it in the saved chest.',
  perform,
  async execute(context, command) {
    const amount = command.args?.amount ?? DEFAULT_COBBLE_TARGET;
    return context.tasks.run(
      `cobble run ${amount}`,
      async ({ signal }) => perform(context, command, { signal }),
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
