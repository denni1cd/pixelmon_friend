const { formatSchemaError, validateSchemaValue } = require('./schema');

function createPolicyGate(context, registry) {
  function fail(toolName, reason, failureCode, extra = {}) {
    return {
      allowed: false,
      toolName,
      normalizedArgs: null,
      reason,
      failureCode,
      ...extra
    };
  }

  function checkPrecondition(precondition) {
    switch (precondition) {
      case 'bot_spawned':
      case 'world_accessible':
        return context.mcData
          ? null
          : { reason: 'Bot is still spawning.', failureCode: 'BOT_NOT_READY' };
      case 'home_known':
        return context.state.getHomePosition?.()
          ? null
          : { reason: 'Home is not set yet.', failureCode: 'HOME_NOT_SET' };
      case 'saved_chest_known':
        return context.state.getChestPosition?.()
          ? null
          : { reason: 'Chest is not set yet.', failureCode: 'NO_CHEST_SAVED' };
      default:
        return null;
    }
  }

  function validate({ toolName, args = {}, allowTools = null, withinTask = false }) {
    const tool = registry.get(toolName);
    if (!tool) {
      return fail(toolName, 'Tool is not registered.', 'TOOL_NOT_REGISTERED');
    }

    if (Array.isArray(allowTools) && !allowTools.includes(toolName)) {
      return fail(toolName, 'Tool is not allowed for this request.', 'TOOL_NOT_ALLOWED');
    }

    const normalizedArgsResult = validateSchemaValue(tool.inputSchema, args || {}, '$');
    if (!normalizedArgsResult.ok) {
      return fail(toolName, formatSchemaError(normalizedArgsResult), 'INVALID_TOOL_ARGS', {
        validationError: normalizedArgsResult
      });
    }

    if (!withinTask && tool.allowWhileBusy !== true && context.tasks?.isBusy?.()) {
      return fail(toolName, 'Runtime is already busy.', 'RUNTIME_BUSY');
    }

    for (const precondition of tool.preconditions || []) {
      const result = checkPrecondition(precondition);
      if (result) {
        return fail(toolName, result.reason, result.failureCode, {
          failedPrecondition: precondition
        });
      }
    }

    return {
      allowed: true,
      toolName,
      normalizedArgs: normalizedArgsResult.value || {},
      reason: null,
      failureCode: null
    };
  }

  return {
    validate
  };
}

module.exports = {
  createPolicyGate
};
