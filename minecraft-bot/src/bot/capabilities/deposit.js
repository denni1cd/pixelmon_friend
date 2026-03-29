const { WOOD_BLOCK_NAMES, WOOD_ITEM_NAMES } = require('../resource-utils');

async function perform(context, command, runtime = {}) {
  if (context.toolRuntime?.executeLegacyCommand) {
    return context.toolRuntime.executeLegacyCommand('deposit', command.args || {}, {
      source: runtime.source || 'capability',
      signal: runtime.signal,
      withinTask: true
    });
  }

  const mode = command.args?.mode || 'all';
  const ensureChest = !!command.args?.ensureChest;
  const amount = command.args?.amount ?? null;
  const target = command.args?.target || 'nearby';

  context.helpers.ensureReady();

  if (mode === 'wood' && ensureChest) {
    let plan = await context.helpers.prepareWoodChestPlan();
    if (plan.extraLogsNeeded > 0) {
      const materialGather = await context.helpers.collectResources({
        blockNames: WOOD_BLOCK_NAMES,
        itemNames: WOOD_ITEM_NAMES,
        targetCount: plan.extraLogsNeeded,
        announceText: `Getting ${plan.extraLogsNeeded} logs for chest materials.`,
        signal: runtime.signal,
        noun: 'logs'
      });

      if (!materialGather.ok) {
        return {
          ok: false,
          message: `I only found ${materialGather.data?.collected ?? 0} logs nearby, so I can't make a chest yet.`
        };
      }

      plan = await context.helpers.prepareWoodChestPlan();
    }

    if (plan.extraLogsNeeded > 0) {
      return {
        ok: false,
        message: `I need ${plan.extraLogsNeeded} more logs to make a chest.`
      };
    }
  }

  let chestBlock;
  if (target === 'saved') {
    try {
      chestBlock = context.helpers.savedChestBlock();
    } catch (error) {
      return { ok: false, message: error.message, data: null };
    }
  } else {
    chestBlock = ensureChest
      ? await context.helpers.ensureChestStorage(runtime.signal)
      : context.helpers.nearestChestBlock();
  }

  if (!chestBlock) {
    return {
      ok: false,
      message: target === 'saved' ? 'Chest is not set yet.' : "I can't find a nearby chest."
    };
  }

  const stacks = context.helpers.resourceStacks(mode);
  if (stacks.length === 0) {
    return {
      ok: false,
      message: mode === 'wood' ? "I don't have any wood to deposit." : "I don't have anything to deposit."
    };
  }

  const deposited = await context.helpers.depositItemsInChest(
    chestBlock,
    stacks,
    mode === 'wood' ? amount : null,
    runtime.signal
  );

  if (mode === 'wood') {
    return {
      ok: true,
      message: target === 'saved' ? `Deposited ${deposited} logs into the saved chest.` : `Stashed ${deposited} logs.`,
      data: { deposited }
    };
  }

  if (mode === 'stone') {
    return {
      ok: true,
      message: target === 'saved' ? `Deposited ${deposited} cobblestone into the saved chest.` : `Deposited ${deposited} cobblestone.`,
      data: { deposited }
    };
  }

  if (mode === 'equipment') {
    return {
      ok: true,
      message: target === 'saved' ? `Deposited ${deposited} equipment items into the saved chest.` : `Deposited ${deposited} equipment items.`,
      data: { deposited }
    };
  }

  return {
    ok: true,
    message: target === 'saved' ? `Deposited ${deposited} non-equipment items into the saved chest.` : `Deposited ${deposited} non-equipment items.`,
    data: { deposited }
  };
}

module.exports = {
  name: 'deposit',
  aliases: ['deposit nearest chest', 'stash wood'],
  description: 'Deposit items into a chest.',
  perform,
  async execute(context, command) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('deposit', command.args || {}, {
        source: command.source || 'command'
      });
    }

    const mode = command.args?.mode || 'all';
    const amount = command.args?.amount ?? null;
    return context.tasks.run(
      mode === 'wood' ? `depositing ${amount ?? 'wood'} logs` : 'depositing items',
      async ({ signal }) => perform(context, command, { signal }),
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
