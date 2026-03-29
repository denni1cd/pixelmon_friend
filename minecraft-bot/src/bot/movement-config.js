function itemId(registry, name) {
  return registry.itemsByName?.[name]?.id ?? null;
}

function blockId(registry, name) {
  return registry.blocksByName?.[name]?.id ?? null;
}

function preferredScaffoldingIds(registry) {
  const candidates = [
    'dirt',
    'cobblestone',
    'cobbled_deepslate',
    'oak_planks',
    'spruce_planks',
    'birch_planks',
    'jungle_planks',
    'acacia_planks',
    'dark_oak_planks',
    'mangrove_planks',
    'cherry_planks',
    'pale_oak_planks',
    'oak_log',
    'spruce_log',
    'birch_log',
    'jungle_log',
    'acacia_log',
    'dark_oak_log',
    'mangrove_log',
    'cherry_log',
    'pale_oak_log'
  ];

  return candidates
    .map((name) => itemId(registry, name))
    .filter((id, index, ids) => id !== null && ids.indexOf(id) === index);
}

function softDigBlockIds(registry) {
  const names = [
    'oak_leaves',
    'spruce_leaves',
    'birch_leaves',
    'jungle_leaves',
    'acacia_leaves',
    'dark_oak_leaves',
    'mangrove_leaves',
    'cherry_leaves',
    'pale_oak_leaves',
    'azalea_leaves',
    'flowering_azalea_leaves',
    'vine',
    'short_grass',
    'tall_grass'
  ];

  return names
    .map((name) => blockId(registry, name))
    .filter((id, index, ids) => id !== null && ids.indexOf(id) === index);
}

function configureMovements(movements, registry) {
  movements.canDig = true;
  movements.allow1by1towers = true;
  movements.allowFreeMotion = true;
  movements.placeCost = 2;
  movements.digCost = 1;

  for (const id of preferredScaffoldingIds(registry)) {
    if (!movements.scafoldingBlocks.includes(id)) {
      movements.scafoldingBlocks.push(id);
    }
  }

  for (const id of softDigBlockIds(registry)) {
    movements.blocksToAvoid.delete(id);
  }

  return movements;
}

module.exports = {
  configureMovements,
  preferredScaffoldingIds,
  softDigBlockIds
};
