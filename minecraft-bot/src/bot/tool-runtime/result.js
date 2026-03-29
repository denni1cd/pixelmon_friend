function normalizeStatus(ok, status) {
  if (status) {
    return status;
  }

  return ok ? 'completed' : 'failed';
}

function createToolResult(toolName, partial = {}) {
  const ok = partial.ok !== false;

  return {
    ok,
    status: normalizeStatus(ok, partial.status),
    toolName,
    message: partial.message || (ok ? 'Done.' : 'Tool failed.'),
    data: partial.data ?? null,
    observation: partial.observation ?? null,
    errorCode: ok ? null : (partial.errorCode || 'TOOL_FAILED'),
    retryable: partial.retryable === true,
    sideEffects: Array.isArray(partial.sideEffects) ? partial.sideEffects : [],
    metrics: partial.metrics ?? {}
  };
}

function createToolSuccess(toolName, partial = {}) {
  return createToolResult(toolName, {
    ...partial,
    ok: true,
    errorCode: null
  });
}

function createToolFailure(toolName, partial = {}) {
  return createToolResult(toolName, {
    ...partial,
    ok: false
  });
}

module.exports = {
  createToolFailure,
  createToolResult,
  createToolSuccess
};
