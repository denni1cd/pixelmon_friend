module.exports = {
  name: 'enable_wood_maintenance',
  aliases: ['enable wood maintenance'],
  description: 'Enable periodic idle wood stock maintenance.',
  async execute(context, command) {
    const target = context.helpers.resolveWoodStockTarget(command.args?.minimumChestWood);
    context.helpers.updateWoodMaintenanceState({
      enabled: true,
      minimumChestWood: target,
      cooldownUntil: null
    });

    return {
      ok: true,
      message: `Wood maintenance enabled at ${target} logs.`,
      data: { enabled: true, minimumChestWood: target }
    };
  }
};
