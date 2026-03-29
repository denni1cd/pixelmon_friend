const { DEFAULT_WOOD_STOCK_TARGET } = require('../constants');
const { DEFAULT_CRAFT_PLANK_TARGET, DEFAULT_CRAFT_STICK_TARGET } = require('../resource-utils');

const SHARED_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    status: { type: 'string' },
    toolName: { type: 'string' },
    message: { type: 'string' },
    data: { type: 'object' },
    observation: { type: 'object' },
    errorCode: { type: 'string' },
    retryable: { type: 'boolean' },
    sideEffects: {
      type: 'array',
      items: { type: 'string' }
    },
    metrics: { type: 'object' }
  }
};

function buildDefinition(definition) {
  return {
    ...definition,
    snapshot: {
      name: definition.name,
      description: definition.description,
      category: definition.category,
      inputSchema: definition.inputSchema,
      outputSchema: definition.outputSchema || SHARED_RESULT_SCHEMA,
      preconditions: definition.preconditions || [],
      sideEffects: definition.sideEffects || [],
      retryPolicy: definition.retryPolicy || { retryable: false, maxRetries: 0 },
      errorCodes: definition.errorCodes || [],
      estimatedCost: definition.estimatedCost || null,
      estimatedDurationMs: definition.estimatedDurationMs || null
    }
  };
}

const TOOL_DEFINITIONS = [
  buildDefinition({
    name: 'gather_logs',
    description: 'Gather nearby reachable logs.',
    category: 'resource',
    inputSchema: {
      type: 'object',
      properties: {
        targetCount: { type: 'integer', minimum: 1, default: 8 },
        searchRadius: { type: 'integer', minimum: 1, default: 32 },
        preferredLogTypes: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    preconditions: ['bot_spawned', 'world_accessible'],
    sideEffects: ['movement', 'block_breaking', 'inventory_change'],
    retryPolicy: { retryable: true, maxRetries: 1 },
    errorCodes: ['NO_LOGS_FOUND', 'PATH_FAILED', 'INVENTORY_FULL', 'TASK_CANCELLED']
  }),
  buildDefinition({
    name: 'deposit_items',
    description: 'Deposit selected items into a nearby or remembered chest.',
    category: 'storage',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['all', 'wood', 'stone', 'equipment', 'resources'],
          default: 'all'
        },
        target: {
          type: 'string',
          enum: ['saved', 'nearby'],
          default: 'saved'
        },
        amount: { type: 'integer', minimum: 1 },
        ensureChest: { type: 'boolean', default: false }
      }
    },
    preconditions: ['bot_spawned', 'world_accessible'],
    sideEffects: ['movement', 'inventory_change', 'container_access'],
    retryPolicy: { retryable: true, maxRetries: 1 },
    errorCodes: ['NO_CHEST_SAVED', 'NO_CHEST_AVAILABLE', 'CHEST_UNREACHABLE', 'TASK_CANCELLED']
  }),
  buildDefinition({
    name: 'inspect_inventory',
    description: 'Report inventory summary and counts without world interaction.',
    category: 'observation',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    preconditions: [],
    sideEffects: [],
    retryPolicy: { retryable: false, maxRetries: 0 },
    errorCodes: []
  }),
  buildDefinition({
    name: 'inspect_status',
    description: 'Report current runtime status, remembered anchors, and task state.',
    category: 'observation',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    preconditions: [],
    sideEffects: [],
    retryPolicy: { retryable: false, maxRetries: 0 },
    errorCodes: []
  }),
  buildDefinition({
    name: 'inspect_chest_stock',
    description: 'Inspect remembered chest wood stock against a target threshold.',
    category: 'observation',
    inputSchema: {
      type: 'object',
      properties: {
        minimumChestWood: {
          type: 'integer',
          minimum: 1,
          default: DEFAULT_WOOD_STOCK_TARGET
        }
      }
    },
    preconditions: ['bot_spawned', 'saved_chest_known'],
    sideEffects: ['container_access'],
    retryPolicy: { retryable: false, maxRetries: 0 },
    errorCodes: ['NO_CHEST_SAVED', 'CHEST_MISSING', 'CHEST_UNREACHABLE']
  }),
  buildDefinition({
    name: 'go_home',
    description: 'Return to the remembered home position.',
    category: 'movement',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    preconditions: ['bot_spawned', 'home_known'],
    sideEffects: ['movement'],
    retryPolicy: { retryable: true, maxRetries: 1 },
    errorCodes: ['HOME_NOT_SET', 'PATH_FAILED', 'TASK_CANCELLED']
  }),
  buildDefinition({
    name: 'craft_item',
    description: 'Craft a supported core item or starter tool.',
    category: 'crafting',
    inputSchema: {
      type: 'object',
      properties: {
        itemName: {
          type: 'string',
          enum: [
            'crafting_table',
            'chest',
            'oak_planks',
            'stick',
            'wooden_axe',
            'wooden_pickaxe',
            'stone_axe',
            'stone_pickaxe'
          ]
        },
        amount: { type: 'integer', minimum: 1, default: 1 }
      },
      required: ['itemName']
    },
    preconditions: ['bot_spawned', 'world_accessible'],
    sideEffects: ['inventory_change', 'container_access', 'movement'],
    retryPolicy: { retryable: true, maxRetries: 1 },
    errorCodes: ['INSUFFICIENT_MATERIALS', 'TASK_CANCELLED', 'UNSUPPORTED_CRAFT']
  }),
  buildDefinition({
    name: 'ensure_chest_access',
    description: 'Ensure a reachable chest exists, crafting or placing one if needed.',
    category: 'storage',
    inputSchema: {
      type: 'object',
      properties: {
        remember: { type: 'boolean', default: true }
      }
    },
    preconditions: ['bot_spawned', 'world_accessible'],
    sideEffects: ['movement', 'inventory_change', 'block_placement'],
    retryPolicy: { retryable: true, maxRetries: 1 },
    errorCodes: ['INSUFFICIENT_MATERIALS', 'PATH_FAILED', 'TASK_CANCELLED']
  }),
  buildDefinition({
    name: 'recover_from_stuck',
    description: 'Stop active movement and reset deterministic movement state.',
    category: 'recovery',
    inputSchema: {
      type: 'object',
      properties: {
        reason: { type: 'string', default: 'stuck' }
      }
    },
    preconditions: [],
    sideEffects: ['movement_reset'],
    retryPolicy: { retryable: false, maxRetries: 0 },
    errorCodes: []
  }),
  buildDefinition({
    name: 'maintain_wood_stock',
    description: 'Planner-safe objective wrapper for restocking remembered chest wood.',
    category: 'objective',
    inputSchema: {
      type: 'object',
      properties: {
        minimumChestWood: {
          type: 'integer',
          minimum: 1,
          default: DEFAULT_WOOD_STOCK_TARGET
        }
      }
    },
    preconditions: ['bot_spawned'],
    sideEffects: ['movement', 'inventory_change', 'container_access'],
    retryPolicy: { retryable: false, maxRetries: 0 },
    errorCodes: ['OBJECTIVE_BLOCKED', 'OBJECTIVE_LIMIT_REACHED', 'TASK_CANCELLED']
  }),
  buildDefinition({
    name: 'craft_planks',
    description: 'Craft planks from held logs.',
    category: 'crafting',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'integer', minimum: 1, default: DEFAULT_CRAFT_PLANK_TARGET }
      }
    },
    preconditions: ['bot_spawned'],
    sideEffects: ['inventory_change'],
    retryPolicy: { retryable: true, maxRetries: 1 },
    errorCodes: ['INSUFFICIENT_MATERIALS', 'TASK_CANCELLED']
  }),
  buildDefinition({
    name: 'craft_sticks',
    description: 'Craft sticks from planks.',
    category: 'crafting',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'integer', minimum: 1, default: DEFAULT_CRAFT_STICK_TARGET }
      }
    },
    preconditions: ['bot_spawned'],
    sideEffects: ['inventory_change'],
    retryPolicy: { retryable: true, maxRetries: 1 },
    errorCodes: ['INSUFFICIENT_MATERIALS', 'TASK_CANCELLED']
  })
];

module.exports = {
  TOOL_DEFINITIONS
};
