const { DEFAULT_WOOD_STOCK_TARGET } = require('../constants');
const { createToolFailure, createToolSuccess } = require('./result');

function createRuleBasedPlanner() {
  return {
    async nextStep(objective, loopState) {
      if (objective.goalType !== 'maintain_wood_stock') {
        return {
          type: 'blocked',
          message: `Unsupported objective ${objective.goalType}.`
        };
      }

      const lastResult = loopState.lastResult;
      if (!lastResult) {
        return {
          type: 'tool',
          toolName: 'inspect_chest_stock',
          args: {
            minimumChestWood: objective.context.targetWoodStock
          }
        };
      }

      if (lastResult.toolName === 'inspect_chest_stock' && lastResult.ok) {
        const stock = lastResult.data?.stock;
        if (!stock?.needsRefill) {
          const completedRestock = loopState.history.some((entry) => entry.toolName === 'deposit_items' && entry.ok);
          return {
            type: 'complete',
            message: completedRestock
              ? `Wood maintenance complete: chest now has ${stock.count}/${stock.target} logs.`
              : `Wood stock okay: ${stock.count}/${stock.target} logs in the chest.`
          };
        }

        return {
          type: 'tool',
          toolName: 'gather_logs',
          args: {
            targetCount: stock.deficit
          }
        };
      }

      if (lastResult.toolName === 'gather_logs' && lastResult.ok) {
        return {
          type: 'tool',
          toolName: 'deposit_items',
          args: {
            mode: 'wood',
            target: 'saved',
            amount: lastResult.data?.collected ?? objective.context.targetWoodStock,
            ensureChest: true
          }
        };
      }

      if (lastResult.toolName === 'deposit_items' && lastResult.ok) {
        return {
          type: 'tool',
          toolName: 'inspect_chest_stock',
          args: {
            minimumChestWood: objective.context.targetWoodStock
          }
        };
      }

      if (lastResult.toolName === 'ensure_chest_access' && lastResult.ok) {
        return {
          type: 'tool',
          toolName: 'deposit_items',
          args: {
            mode: 'wood',
            target: 'saved',
            ensureChest: true
          }
        };
      }

      return {
        type: 'blocked',
        message: 'Objective planner could not determine a safe next step.'
      };
    }
  };
}

function createObjectiveRunner({ context, executeTool, recoveryPolicy, planner = createRuleBasedPlanner() }) {
  async function runObjective(objectiveInput, options = {}) {
    const objective = {
      goalType: objectiveInput.goalType,
      goal: objectiveInput.goal || objectiveInput.goalType,
      constraints: {
        maxSteps: objectiveInput.constraints?.maxSteps ?? 8,
        maxFailures: objectiveInput.constraints?.maxFailures ?? 2,
        allowTools: objectiveInput.constraints?.allowTools || [
          'inspect_chest_stock',
          'gather_logs',
          'deposit_items',
          'ensure_chest_access'
        ]
      },
      context: {
        targetWoodStock: objectiveInput.context?.targetWoodStock ?? DEFAULT_WOOD_STOCK_TARGET,
        ...objectiveInput.context
      }
    };

    const executeLoop = async ({ signal, setDetails } = {}) => {
      context.state.beginObjective?.({
        goal: objective.goal,
        goalType: objective.goalType,
        maxSteps: objective.constraints.maxSteps,
        allowedTools: objective.constraints.allowTools
      });

      const recentHistory = [];
      let lastResult = null;
      let step = 0;
      let failureCount = 0;

      while (step < objective.constraints.maxSteps) {
        step += 1;
        setDetails?.({
          objective: objective.goal,
          step,
          maxSteps: objective.constraints.maxSteps
        });
        context.state.setObjectiveState?.({
          currentStep: step,
          status: 'running'
        });

        const decision = await planner.nextStep(objective, {
          step,
          lastResult,
          history: recentHistory.slice()
        });

        if (decision.type === 'complete') {
          context.state.completeObjective?.({
            status: 'completed',
            completedAt: new Date().toISOString()
          });
          return createToolSuccess('maintain_wood_stock', {
            message: decision.message || 'Objective completed.',
            status: 'completed',
            data: {
              objective: objective.goal,
              steps: step - 1,
              recentHistory
            },
            observation: {
              recentHistory
            }
          });
        }

        if (decision.type !== 'tool') {
          context.state.completeObjective?.({
            status: 'blocked',
            blockedAt: new Date().toISOString()
          });
          return createToolFailure('maintain_wood_stock', {
            message: decision.message || 'Objective blocked.',
            errorCode: 'OBJECTIVE_BLOCKED',
            retryable: false,
            data: {
              objective: objective.goal,
              steps: step - 1,
              recentHistory
            },
            observation: {
              recentHistory
            }
          });
        }

        const toolResult = await executeTool({
          toolName: decision.toolName,
          args: decision.args || {},
          source: options.source || 'objective',
          allowTools: objective.constraints.allowTools,
          withinTask: true,
          signal
        });

        recentHistory.push({
          ok: toolResult.ok,
          toolName: toolResult.toolName,
          status: toolResult.status,
          errorCode: toolResult.errorCode || null
        });
        lastResult = toolResult;

        if (toolResult.ok) {
          failureCount = 0;
          continue;
        }

        failureCount += 1;
        if (failureCount > objective.constraints.maxFailures) {
          context.state.completeObjective?.({
            status: 'failed',
            failedAt: new Date().toISOString()
          });
          return createToolFailure('maintain_wood_stock', {
            message: 'Objective stopped after repeated tool failures.',
            errorCode: 'OBJECTIVE_LIMIT_REACHED',
            retryable: false,
            data: {
              objective: objective.goal,
              steps: step,
              recentHistory
            },
            observation: {
              recentHistory
            }
          });
        }

        const recovery = recoveryPolicy.handleFailure({
          toolCall: {
            toolName: decision.toolName,
            args: decision.args || {}
          },
          result: toolResult,
          objective,
          recentHistory
        });

        if (recovery.strategy === 'retry' || recovery.strategy === 'follow_up_tool') {
          const recoveryResult = await executeTool({
            toolName: recovery.nextTool,
            args: recovery.args || {},
            source: 'recovery',
            allowTools: objective.constraints.allowTools,
            withinTask: true,
            signal
          });
          recentHistory.push({
            ok: recoveryResult.ok,
            toolName: recoveryResult.toolName,
            status: recoveryResult.status,
            errorCode: recoveryResult.errorCode || null
          });
          lastResult = recoveryResult;
          if (recoveryResult.ok) {
            failureCount = 0;
            continue;
          }
        }

        context.state.completeObjective?.({
          status: 'blocked',
          blockedAt: new Date().toISOString()
        });
        return createToolFailure('maintain_wood_stock', {
          message: `Objective blocked on ${toolResult.toolName}: ${toolResult.message}`,
          errorCode: 'OBJECTIVE_BLOCKED',
          retryable: false,
          data: {
            objective: objective.goal,
            steps: step,
            recentHistory
          },
          observation: {
            recentHistory
          }
        });
      }

      context.state.completeObjective?.({
        status: 'failed',
        failedAt: new Date().toISOString()
      });
      return createToolFailure('maintain_wood_stock', {
        message: 'Objective exceeded the configured step limit.',
        errorCode: 'OBJECTIVE_LIMIT_REACHED',
        retryable: false,
        data: {
          objective: objective.goal,
          steps: objective.constraints.maxSteps,
          recentHistory
        },
        observation: {
          recentHistory
        }
      });
    };

    if (options.withinTask) {
      return executeLoop({ signal: options.signal, setDetails: options.setDetails });
    }

    return context.tasks.run(
      objective.goal,
      executeLoop,
      { onCancel: () => context.helpers.stopAllActions() }
    );
  }

  return {
    runObjective
  };
}

module.exports = {
  createObjectiveRunner,
  createRuleBasedPlanner
};
