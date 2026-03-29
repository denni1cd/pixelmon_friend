const { DEFAULT_COBBLE_TARGET, DEFAULT_CRAFT_PLANK_TARGET, DEFAULT_CRAFT_STICK_TARGET, DEFAULT_GATHER_TARGET } = require('./resource-utils');
const { DEFAULT_WOOD_STOCK_TARGET } = require('./constants');

const ACTION_CATALOG = {
  gather_wood: {
    args: {
      amount: { type: 'count', defaultValue: DEFAULT_GATHER_TARGET }
    }
  },
  wood_run: {
    args: {
      amount: { type: 'count', defaultValue: DEFAULT_GATHER_TARGET }
    }
  },
  cobble_run: {
    args: {
      amount: { type: 'count', defaultValue: DEFAULT_COBBLE_TARGET }
    }
  },
  deposit: {
    args: {
      mode: { type: 'enum', values: ['all', 'wood', 'stone', 'equipment'], defaultValue: 'all' },
      target: { type: 'enum', values: ['saved', 'nearby'], defaultValue: 'saved' },
      amount: { type: 'count', optional: true }
    }
  },
  check_wood_stock: { args: {} },
  maintain_wood: {
    args: {
      minimumChestWood: { type: 'count', defaultValue: DEFAULT_WOOD_STOCK_TARGET },
      mode: { type: 'enum', values: ['run_once'], defaultValue: 'run_once' }
    }
  },
  enable_wood_maintenance: { args: {} },
  disable_wood_maintenance: { args: {} },
  go_home: { args: {} },
  inventory: { args: {} },
  status: { args: {} },
  craft_planks: {
    args: {
      amount: { type: 'count', defaultValue: DEFAULT_CRAFT_PLANK_TARGET }
    }
  },
  craft_sticks: {
    args: {
      amount: { type: 'count', defaultValue: DEFAULT_CRAFT_STICK_TARGET }
    }
  },
  craft_crafting_table: { args: {} },
  craft_chest: { args: {} },
  craft_wooden_axe: { args: {} },
  craft_wooden_pickaxe: { args: {} },
  craft_stone_axe: { args: {} },
  craft_stone_pickaxe: { args: {} }
};

function allowlistedActions() {
  return Object.keys(ACTION_CATALOG);
}

function catalogForPrompt() {
  return allowlistedActions().map((action) => ({
    action,
    args: Object.keys(ACTION_CATALOG[action].args || {})
  }));
}

function parsePositiveCount(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeArgs(action, args = {}) {
  const config = ACTION_CATALOG[action];
  if (!config) {
    return { ok: false, reason: 'unsupported_action' };
  }

  if (args === null || typeof args !== 'object' || Array.isArray(args)) {
    return { ok: false, reason: 'invalid_args' };
  }

  const argConfig = config.args || {};
  const unsupportedKeys = Object.keys(args).filter((key) => !(key in argConfig));
  if (unsupportedKeys.length > 0) {
    return { ok: false, reason: 'unsupported_args' };
  }

  const normalized = {};
  for (const [key, rule] of Object.entries(argConfig)) {
    const rawValue = args[key];

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      if ('defaultValue' in rule) {
        normalized[key] = rule.defaultValue;
        continue;
      }

      if (rule.optional) {
        continue;
      }

      return { ok: false, reason: 'missing_arg', key };
    }

    if (rule.type === 'count') {
      const parsed = parsePositiveCount(rawValue);
      if (parsed === null) {
        return { ok: false, reason: 'invalid_count', key };
      }
      normalized[key] = parsed;
      continue;
    }

    if (rule.type === 'enum') {
      if (!rule.values.includes(rawValue)) {
        return { ok: false, reason: 'invalid_enum', key };
      }
      normalized[key] = rawValue;
      continue;
    }
  }

  return { ok: true, args: normalized };
}

function normalizeIntentPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      ok: false,
      reason: 'invalid_payload',
      message: "I didn't understand that request."
    };
  }

  const kind = payload.kind || (payload.action ? 'task' : null);
  if (kind === 'conversation') {
    return { ok: true, type: 'conversation' };
  }

  if (kind === 'unsupported') {
    return {
      ok: true,
      type: 'refusal',
      message: payload.message || "I can't help with that yet."
    };
  }

  if (kind !== 'task') {
    return {
      ok: false,
      reason: 'invalid_kind',
      message: "I didn't understand that request."
    };
  }

  const action = typeof payload.action === 'string' ? payload.action.trim() : '';
  if (!ACTION_CATALOG[action]) {
    return {
      ok: false,
      reason: 'unsupported_action',
      message: "I can't do that yet."
    };
  }

  const normalizedArgs = normalizeArgs(action, payload.args || {});
  if (!normalizedArgs.ok) {
    const reasonMessages = {
      invalid_args: "I didn't understand that request.",
      unsupported_args: "I couldn't safely use those task arguments.",
      missing_arg: "That request was missing information I need.",
      invalid_count: 'That count needs to be a positive number.',
      invalid_enum: "I couldn't safely use that option."
    };

    return {
      ok: false,
      reason: normalizedArgs.reason,
      key: normalizedArgs.key || null,
      message: reasonMessages[normalizedArgs.reason] || "I didn't understand that request."
    };
  }

  return {
    ok: true,
    type: 'task',
    intent: {
      action,
      args: normalizedArgs.args
    }
  };
}

module.exports = {
  ACTION_CATALOG,
  allowlistedActions,
  catalogForPrompt,
  normalizeIntentPayload
};
