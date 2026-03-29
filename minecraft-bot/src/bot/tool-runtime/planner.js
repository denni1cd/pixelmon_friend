const { TOOL_ERROR_CODES } = require('./error-codes');

function createObjectivePlanner({ context, getToolRuntime, recoveryPolicy }) {
  function plannerSummary(memory) {
    return {
      stock: memory.stock || null,
      gathered: memory.gathered || 0,
      deposited: memory.deposited || 0,
      chestEnsured: !!memory.chestEnsured
    };
  }

  function nextActionForMaintainWood(objective, memory) {
    if (memory.lastFailureCode && [TOOL_ERROR_CODES.NO_CHEST_SAVED, TOOL_ERROR_CODES.CHEST_MISSING].includes(memory.lastFailureCode) && !memory.chestEnsured) {
      return {
        status: 'tool',
        toolName: 'ensure_chest_access',
        args: {
          target: 'saved',
          remember: true
        }
      };
    }

    if (!memory.stock) {
      return {
        status: 'tool',
        toolName: 'inspect_chest_stock',
        args: {
          minimumChestWood: memory.targetWoodStock
        }
      };
    }

    if (!memory.stock.needsRefill) {
      return {
        status: 'complete',
        message: `Wood maintenance complete: chest now has ${memory.stock.count}/${memory.stock.target} logs.`
      };
    }

    if (!memory.gathered) {
      return {
        status: 'tool',
        toolName: 'gather_logs',
        args: {
          targetCount: memory.stock.deficit
        }
      };
    }

    if (!memory.deposited) {
      return {
        status: 'tool',
        toolName: 'deposit_items',
        args: {
          mode: 'wood',
          target: 'saved',
          amount: memory.gathered,
          ensureChest: true
        }
      };
    }

    return {
      status: 'tool',
      toolName: 'inspect_chest_stock',
      args: {
        minimumChestWood: memory.targetWoodStock
      }
    };
  }

  function nextActionForWoodRun(objective, memory) {
    if (!memory.chestEnsured) {
      return {
        status: 'tool',
        toolName: 'ensure_chest_access',
        args: {
          target: 'saved',
          remember: true
        }
      };
    }

    if (!memory.gathered) {
      return {
        status: 'tool',
        toolName: 'gather_logs',
        args: {
          targetCount: memory.targetCount
        }
      };
    }

    if (!memory.deposited) {
      return {
        status: 'tool',
        toolName: 'deposit_items',
        args: {
          mode: 'wood',
          target: 'saved',
          amount: memory.gathered,
          ensureChest: true
        }
      };
    }

    return {
      status: 'complete',
      message: `Wood run complete: gathered and deposited ${memory.deposited} logs.`
    };
  }

  function updateMemory(memory, result) {
    if (!result.ok) {
      memory.lastFailureCode = result.errorCode;
      return memory;
    }

    memory.lastFailureCode = null;
    switch (result.toolName) {
      case 'ensure_chest_access':
        memory.chestEnsured = true;
        break;
      case 'inspect_chest_stock':
        memory.stock = result.data?.stock || null;
        if (memory.deposited) {
          memory.gathered = 0;
          memory.deposited = 0;
        }
        break;
      case 'gather_logs':
        memory.gathered = result.data?.collected || 0;
        break;
      case 'deposit_items':
        memory.deposited = result.data?.deposited || 0;
        break;
      case 'recover_from_stuck':
        memory.recovered = true;
        break;
      default:
        break;
    }

    return memory;
  }

  function planNextAction(objective, memory) {
    switch (objective.goal) {
      case 'maintain_wood_stock':
        return nextActionForMaintainWood(objective, memory);
      case 'wood_run_to_saved_chest':
        return nextActionForWoodRun(objective, memory);
      default:
        return {
          status: 'blocked',
          message: `Unsupported objective: ${objective.goal}.`,
          errorCode: TOOL_ERROR_CODES.OBJECTIVE_UNSUPPORTED
        };
    }
  }

  async function runObjective(objective, runtime = {}) {
    const maxSteps = objective.constraints?.maxSteps || 8;
    const toolRuntime = getToolRuntime();
    const memory = {
      ...(objective.context || {})
    };

    context.state.beginObjective?.({
      goal: objective.goal,
      maxSteps
    });

    let step = 0;
    let repeatedFailures = 0;
    let pendingFollowUp = null;

    while (step < maxSteps) {
      step += 1;
      context.state.updateObjective?.({
        step,
        activeTool: pendingFollowUp?.toolName || null
      });

      const next = pendingFollowUp || planNextAction(objective, memory);
      pendingFollowUp = null;

      if (next.status === 'complete') {
        context.state.clearObjective?.();
        return {
          ok: true,
          status: 'completed',
          message: next.message,
          data: {
            goal: objective.goal,
            steps: step - 1,
            summary: plannerSummary(memory)
          }
        };
      }

      if (next.status === 'blocked') {
        context.state.clearObjective?.();
        return {
          ok: false,
          status: 'blocked',
          message: next.message,
          errorCode: next.errorCode || TOOL_ERROR_CODES.OBJECTIVE_BLOCKED,
          data: {
            goal: objective.goal,
            steps: step - 1,
            summary: plannerSummary(memory)
          }
        };
      }

      const result = await toolRuntime.executeTool({
        toolName: next.toolName,
        args: next.args || {},
        allowTools: objective.constraints?.allowTools || null,
        internalObjective: true,
        source: 'objective',
        signal: runtime.signal
      });

      updateMemory(memory, result);

      if (result.ok) {
        repeatedFailures = 0;
        continue;
      }

      repeatedFailures += 1;
      const objectiveState = context.state.getObjectiveState?.() || {};
      const retryCounts = {
        ...(objectiveState.retryCounts || {})
      };
      const retryKey = `${result.toolName}:${result.errorCode || 'UNKNOWN'}`;
      retryCounts[retryKey] = (retryCounts[retryKey] || 0) + 1;
      context.state.updateObjective?.({
        failureStreak: repeatedFailures,
        retryCounts
      });

      if (repeatedFailures >= 2) {
        context.state.clearObjective?.();
        return {
          ok: false,
          status: 'blocked',
          message: `Objective aborted after repeated failures in ${result.toolName}.`,
          errorCode: TOOL_ERROR_CODES.OBJECTIVE_REPEAT_LIMIT,
          data: {
            goal: objective.goal,
            failedResult: result
          }
        };
      }

      const recovery = recoveryPolicy.handleFailure({
        result,
        objective,
        retryCounts
      });

      if (recovery.strategy === 'follow_up_tool') {
        pendingFollowUp = {
          status: 'tool',
          toolName: recovery.nextTool,
          args: recovery.args || {}
        };
        continue;
      }

      if (recovery.strategy === 'retry_tool') {
        pendingFollowUp = {
          status: 'tool',
          toolName: recovery.nextTool,
          args: next.args || {}
        };
        continue;
      }

      context.state.clearObjective?.();
      return {
        ok: false,
        status: 'blocked',
        message: result.message,
        errorCode: result.errorCode || TOOL_ERROR_CODES.OBJECTIVE_BLOCKED,
        data: {
          goal: objective.goal,
          failedResult: result
        }
      };
    }

    context.state.clearObjective?.();
    return {
      ok: false,
      status: 'blocked',
      message: `Objective step limit reached for ${objective.goal}.`,
      errorCode: TOOL_ERROR_CODES.OBJECTIVE_STEP_LIMIT,
      data: {
        goal: objective.goal,
        maxSteps
      }
    };
  }

  return {
    runObjective
  };
}

module.exports = {
  createObjectivePlanner
};
