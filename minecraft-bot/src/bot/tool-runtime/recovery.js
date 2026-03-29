const { TOOL_ERROR_CODES } = require('./error-codes');

function createRecoveryPolicy() {
  function handleFailure({
    result,
    objective,
    retryCounts = {}
  }) {
    const allowTools = objective?.constraints?.allowTools || [];
    const retryKey = `${result.toolName}:${result.errorCode || 'UNKNOWN'}`;
    const retryCount = retryCounts[retryKey] || 0;

    if (
      [
        TOOL_ERROR_CODES.NO_CHEST_SAVED,
        TOOL_ERROR_CODES.CHEST_MISSING,
        TOOL_ERROR_CODES.NO_CHEST_FOUND
      ].includes(result.errorCode)
      && allowTools.includes('ensure_chest_access')
      && retryCount < 1
    ) {
      return {
        handled: true,
        strategy: 'follow_up_tool',
        nextTool: 'ensure_chest_access',
        args: {
          target: 'saved',
          remember: true
        },
        reason: result.errorCode
      };
    }

    if (
      result.errorCode === TOOL_ERROR_CODES.PATH_FAILED
      && allowTools.includes('recover_from_stuck')
      && retryCount < 1
    ) {
      return {
        handled: true,
        strategy: 'follow_up_tool',
        nextTool: 'recover_from_stuck',
        args: {},
        reason: result.errorCode
      };
    }

    if (
      result.errorCode === TOOL_ERROR_CODES.PATH_FAILED
      && result.retryable
      && retryCount < 2
    ) {
      return {
        handled: true,
        strategy: 'retry_tool',
        nextTool: result.toolName,
        args: result.data?.requestedArgs || null,
        reason: result.errorCode
      };
    }

    if (result.errorCode === TOOL_ERROR_CODES.TASK_CANCELLED) {
      return {
        handled: true,
        strategy: 'abort',
        reason: result.errorCode
      };
    }

    return {
      handled: false,
      strategy: 'abort',
      reason: result.errorCode || TOOL_ERROR_CODES.OBJECTIVE_BLOCKED
    };
  }

  return {
    handleFailure
  };
}

module.exports = {
  createRecoveryPolicy
};
