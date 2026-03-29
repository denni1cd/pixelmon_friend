const { DEFAULT_WOOD_STOCK_TARGET } = require('../constants');

async function perform(context, command, runtime = {}) {
  if (context.toolRuntime?.executeLegacyCommand) {
    return context.toolRuntime.executeLegacyCommand('maintain_wood', command.args || {}, {
      source: runtime.source || 'capability',
      signal: runtime.signal,
      withinTask: true
    });
  }

  const minimumChestWood = context.helpers.resolveWoodStockTarget(
    command.args?.minimumChestWood ?? DEFAULT_WOOD_STOCK_TARGET
  );
  const mode = command.args?.mode || 'run_once';
  const stock = await context.helpers.inspectSavedChestWoodStock(minimumChestWood, runtime.signal);
  if (!stock.needsRefill) {
    return {
      ok: true,
      message: mode === 'auto' ? null : `${context.helpers.woodStockStatusMessage(stock, { includeMode: false })} No refill needed.`,
      data: { stock, refilled: false }
    };
  }

  const gatherCapability = context.registry.resolve('gather_wood');
  const depositCapability = context.registry.resolve('deposit');

  if (!gatherCapability?.perform || !depositCapability?.perform) {
    throw new Error('Wood maintenance dependencies are not available.');
  }

  context.say(`Wood stock low: ${stock.count}/${stock.target} logs. Restocking ${stock.deficit} logs.`);
  const gatherResult = await gatherCapability.perform(context, {
    ...command,
    args: { amount: stock.deficit }
  }, runtime);

  const gathered = gatherResult.data?.collected ?? 0;
  if (gathered <= 0) {
    return {
      ok: false,
      message: `Wood maintenance failed: ${gatherResult.message}`,
      data: { stock, gathered: 0 }
    };
  }

  context.say('Heading back to the chest.');
  const depositResult = await depositCapability.perform(context, {
    ...command,
    args: { mode: 'wood', amount: gathered, target: 'saved' }
  }, runtime);

  if (!depositResult.ok) {
    return {
      ok: false,
      message: `Gathered ${gathered} logs, but deposit failed: ${depositResult.message}`,
      data: { stock, gathered, deposited: depositResult.data?.deposited ?? 0 }
    };
  }

  let finalStock;
  try {
    finalStock = await context.helpers.inspectSavedChestWoodStock(minimumChestWood, runtime.signal);
  } catch (error) {
    const estimatedCount = stock.count + (depositResult.data?.deposited ?? gathered);
    finalStock = {
      count: estimatedCount,
      target: minimumChestWood,
      needsRefill: estimatedCount < minimumChestWood
    };
  }

  if (finalStock.needsRefill || gatherResult.ok === false) {
    return {
      ok: true,
      message: `Wood maintenance partial: chest now has ${finalStock.count}/${minimumChestWood} logs after depositing ${depositResult.data?.deposited ?? gathered}.`,
      data: {
        stock,
        finalStock,
        gathered,
        deposited: depositResult.data?.deposited ?? gathered,
        partial: true
      }
    };
  }

  return {
    ok: true,
    message: `Wood maintenance complete: chest now has ${finalStock.count}/${minimumChestWood} logs.`,
    data: {
      stock,
      finalStock,
      gathered,
      deposited: depositResult.data?.deposited ?? gathered,
      partial: false
    }
  };
}

module.exports = {
  name: 'maintain_wood',
  aliases: ['maintain wood'],
  description: 'Inspect chest wood stock and refill it when low.',
  perform,
  async execute(context, command) {
    if (context.toolRuntime?.executeLegacyCommand) {
      return context.toolRuntime.executeLegacyCommand('maintain_wood', command.args || {}, {
        source: command.source || 'command'
      });
    }

    const minimumChestWood = context.helpers.resolveWoodStockTarget(command.args?.minimumChestWood);
    return context.tasks.run(
      `maintaining wood stock ${minimumChestWood}`,
      async ({ signal }) => perform(context, {
        ...command,
        args: {
          ...command.args,
          minimumChestWood
        }
      }, { signal }),
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }
};
