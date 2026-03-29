module.exports = {
  name: 'disable_wood_maintenance',
  aliases: ['disable wood maintenance'],
  description: 'Disable periodic idle wood stock maintenance.',
  async execute(context) {
    const state = context.helpers.updateWoodMaintenanceState({
      enabled: false,
      cooldownUntil: null
    });

    return {
      ok: true,
      message: 'Wood maintenance disabled.',
      data: { enabled: false, minimumChestWood: state?.minimumChestWood ?? null }
    };
  }
};
