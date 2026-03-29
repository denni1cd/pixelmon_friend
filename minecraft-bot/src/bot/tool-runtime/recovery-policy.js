function createRecoveryPolicy() {
  function handleFailure({ toolCall, result, objective, recentHistory = [] }) {
    if (!result || result.ok !== false) {
      return {
        handled: false,
        strategy: 'none',
        nextTool: null,
        args: null,
        reason: null
      };
    }

    const repeatedFailures = recentHistory.filter((entry) => (
      entry.toolName === toolCall.toolName
      && entry.errorCode === result.errorCode
      && entry.ok === false
    )).length;

    if (repeatedFailures >= 2) {
      return {
        handled: true,
        strategy: 'abort',
        nextTool: null,
        args: null,
        reason: 'REPEATED_FAILURE'
      };
    }

    if (result.errorCode === 'NO_CHEST_SAVED' || result.errorCode === 'CHEST_MISSING') {
      if (objective?.constraints?.allowTools?.includes('ensure_chest_access') !== false) {
        return {
          handled: true,
          strategy: 'follow_up_tool',
          nextTool: 'ensure_chest_access',
          args: { remember: true },
          reason: result.errorCode
        };
      }
    }

    if (result.errorCode === 'PATH_FAILED') {
      return {
        handled: true,
        strategy: 'retry',
        nextTool: toolCall.toolName,
        args: toolCall.args,
        reason: result.errorCode
      };
    }

    if (result.errorCode === 'INVENTORY_FULL') {
      return {
        handled: true,
        strategy: 'follow_up_tool',
        nextTool: 'deposit_items',
        args: {
          mode: 'all',
          target: 'saved',
          ensureChest: true
        },
        reason: result.errorCode
      };
    }

    if (result.errorCode === 'TASK_CANCELLED' || result.errorCode === 'RUNTIME_BUSY') {
      return {
        handled: true,
        strategy: 'abort',
        nextTool: null,
        args: null,
        reason: result.errorCode
      };
    }

    return {
      handled: false,
      strategy: 'blocked',
      nextTool: null,
      args: null,
      reason: result.errorCode || 'UNKNOWN_FAILURE'
    };
  }

  return {
    handleFailure
  };
}

module.exports = {
  createRecoveryPolicy
};
