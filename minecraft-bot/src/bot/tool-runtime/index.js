const {
  DEFAULT_CRAFT_PLANK_TARGET,
  DEFAULT_CRAFT_STICK_TARGET,
  DEFAULT_WOOD_TARGET
} = require('../resource-utils');
const { DEFAULT_WOOD_STOCK_TARGET } = require('../constants');
const { TOOL_DEFINITIONS } = require('./tool-definitions');
const { createObjectiveRunner } = require('./objective-runner');
const { createMcpAdapter } = require('./mcp-adapter');
const { createPolicyGate } = require('./policy');
const { createRecoveryPolicy } = require('./recovery-policy');
const { createToolFailure } = require('./result');
const { ToolRegistry } = require('./tool-registry');
const { TOOL_HANDLERS } = require('./tools');

function legacyCommandToRequest(commandName, args = {}) {
  switch (commandName) {
    case 'gather_wood':
      return {
        kind: 'tool',
        toolName: 'gather_logs',
        args: {
          targetCount: args.amount ?? DEFAULT_WOOD_TARGET
        }
      };
    case 'deposit':
      return {
        kind: 'tool',
        toolName: 'deposit_items',
        args: {
          mode: args.mode || 'all',
          target: args.target || 'saved',
          amount: args.amount,
          ensureChest: !!args.ensureChest
        }
      };
    case 'inventory':
      return {
        kind: 'tool',
        toolName: 'inspect_inventory',
        args: {}
      };
    case 'status':
      return {
        kind: 'tool',
        toolName: 'inspect_status',
        args: {}
      };
    case 'check_wood_stock':
      return {
        kind: 'tool',
        toolName: 'inspect_chest_stock',
        args: {
          minimumChestWood: args.minimumChestWood ?? DEFAULT_WOOD_STOCK_TARGET
        }
      };
    case 'go_home':
      return {
        kind: 'tool',
        toolName: 'go_home',
        args: {}
      };
    case 'craft_planks':
      return {
        kind: 'tool',
        toolName: 'craft_planks',
        args: {
          amount: args.amount ?? DEFAULT_CRAFT_PLANK_TARGET
        }
      };
    case 'craft_sticks':
      return {
        kind: 'tool',
        toolName: 'craft_sticks',
        args: {
          amount: args.amount ?? DEFAULT_CRAFT_STICK_TARGET
        }
      };
    case 'craft_crafting_table':
      return {
        kind: 'tool',
        toolName: 'craft_item',
        args: {
          itemName: 'crafting_table',
          amount: 1
        }
      };
    case 'craft_chest':
      return {
        kind: 'tool',
        toolName: 'craft_item',
        args: {
          itemName: 'chest',
          amount: 1
        }
      };
    case 'craft_wooden_axe':
      return {
        kind: 'tool',
        toolName: 'craft_item',
        args: {
          itemName: 'wooden_axe',
          amount: 1
        }
      };
    case 'craft_wooden_pickaxe':
      return {
        kind: 'tool',
        toolName: 'craft_item',
        args: {
          itemName: 'wooden_pickaxe',
          amount: 1
        }
      };
    case 'craft_stone_axe':
      return {
        kind: 'tool',
        toolName: 'craft_item',
        args: {
          itemName: 'stone_axe',
          amount: 1
        }
      };
    case 'craft_stone_pickaxe':
      return {
        kind: 'tool',
        toolName: 'craft_item',
        args: {
          itemName: 'stone_pickaxe',
          amount: 1
        }
      };
    case 'maintain_wood':
      return {
        kind: 'objective',
        objective: {
          goalType: 'maintain_wood_stock',
          goal: 'maintain_wood_stock',
          constraints: {
            maxSteps: 8,
            maxFailures: 2,
            allowTools: [
              'inspect_chest_stock',
              'gather_logs',
              'deposit_items',
              'ensure_chest_access',
              'recover_from_stuck'
            ]
          },
          context: {
            targetWoodStock: args.minimumChestWood ?? DEFAULT_WOOD_STOCK_TARGET,
            mode: args.mode || 'run_once'
          }
        }
      };
    default:
      return null;
  }
}

function createToolRuntime(context) {
  const registry = new ToolRegistry(
    TOOL_DEFINITIONS.map((definition) => ({
      ...definition,
      handler: TOOL_HANDLERS[definition.name] || null,
      taskName(args = {}) {
        switch (definition.name) {
          case 'gather_logs':
            return `gathering ${args.targetCount} logs`;
          case 'deposit_items':
            return args.mode === 'wood' ? `depositing ${args.amount ?? 'wood'} logs` : 'depositing items';
          case 'inspect_chest_stock':
            return 'checking wood stock';
          case 'go_home':
            return 'going home';
          case 'craft_item':
            return `crafting ${args.itemName?.replaceAll('_', ' ') || 'item'}`;
          case 'ensure_chest_access':
            return 'ensuring chest access';
          case 'recover_from_stuck':
            return 'recovering movement';
          case 'craft_planks':
            return 'crafting planks';
          case 'craft_sticks':
            return 'crafting sticks';
          default:
            return definition.name.replaceAll('_', ' ');
        }
      },
      allowWhileBusy: ['inspect_inventory', 'inspect_status'].includes(definition.name)
    }))
  );

  const policy = createPolicyGate(context, registry);
  const recoveryPolicy = createRecoveryPolicy();

  async function invokeHandler(tool, validation, request) {
    const result = await tool.handler(context, validation.normalizedArgs, {
      signal: request.signal,
      source: request.source,
      silent: request.silent === true,
      withinTask: request.withinTask === true || request.internalObjective === true
    });

    context.state.pushToolHistory?.({
      toolName: tool.name,
      args: validation.normalizedArgs,
      source: request.source || 'internal',
      at: new Date().toISOString(),
      result: {
        ok: result.ok,
        status: result.status,
        errorCode: result.errorCode,
        message: result.message
      }
    });

    return result;
  }

  async function executeTool(request) {
    const validation = policy.validate({
      ...request,
      withinTask: request.withinTask === true || request.internalObjective === true
    });
    if (!validation.allowed) {
      const failedResult = createToolFailure(request.toolName, {
        status: 'rejected',
        message: validation.reason,
        errorCode: validation.failureCode,
        retryable: false,
        data: {
          validation
        }
      });
      context.state.pushToolHistory?.({
        toolName: request.toolName,
        args: request.args || {},
        source: request.source || 'internal',
        at: new Date().toISOString(),
        result: {
          ok: false,
          status: failedResult.status,
          errorCode: failedResult.errorCode,
          message: failedResult.message
        }
      });
      return failedResult;
    }

    const tool = registry.get(request.toolName);
    if (!tool?.handler) {
      return createToolFailure(request.toolName, {
        status: 'failed',
        message: 'Tool handler is not implemented.',
        errorCode: 'TOOL_NOT_IMPLEMENTED',
        retryable: false
      });
    }

    try {
      context.state.updateObjective?.({
        activeTool: request.toolName
      });

      if (request.withinTask || request.internalObjective || tool.allowWhileBusy === true) {
        return await invokeHandler(tool, validation, request);
      }

      const taskOutcome = await context.tasks.run(
        tool.taskName(validation.normalizedArgs),
        async ({ signal } = {}) => {
          const toolResult = await invokeHandler(tool, validation, {
            ...request,
            signal,
            withinTask: true
          });
          return {
            ok: toolResult.ok,
            message: toolResult.message,
            data: {
              toolResult
            }
          };
        },
        { onCancel: () => context.helpers.stopAllActions() }
      );

      return taskOutcome.data?.toolResult || createToolFailure(request.toolName, {
        message: taskOutcome.message,
        errorCode: taskOutcome.message?.startsWith('Cancelled')
          ? 'TASK_CANCELLED'
          : 'RUNTIME_BUSY',
        retryable: false
      });
    } finally {
      context.state.updateObjective?.({
        activeTool: null
      });
    }
  }

  const objectives = createObjectiveRunner({
    context,
    executeTool,
    recoveryPolicy
  });

  async function executeObjective(objective, options = {}) {
    const taskOutcome = await context.tasks.run(
      objective.goal || objective.goalType || 'objective',
      async ({ signal, setDetails } = {}) => {
        const objectiveResult = await objectives.runObjective(objective, {
          ...options,
          signal: options.signal || signal,
          setDetails,
          withinTask: true
        });
        return {
          ok: objectiveResult.ok,
          message: objectiveResult.message,
          data: {
            objectiveResult
          }
        };
      },
      { onCancel: () => context.helpers.stopAllActions() }
    );

    return taskOutcome.data?.objectiveResult || taskOutcome;
  }

  async function executeLegacyCommand(commandName, args = {}, meta = {}) {
    const mapped = legacyCommandToRequest(commandName, args);
    if (!mapped) {
      return null;
    }

    if (mapped.kind === 'tool') {
      return executeTool({
        toolName: mapped.toolName,
        args: mapped.args,
        source: meta.source || 'command',
        signal: meta.signal,
        withinTask: meta.withinTask === true,
        silent: meta.silent === true
      });
    }

    return executeObjective(mapped.objective, {
      source: meta.source || 'command',
      signal: meta.signal,
      withinTask: meta.withinTask === true
    });
  }

  const mcp = createMcpAdapter({
    registry,
    executeTool
  });

  return {
    registry,
    policy,
    policyGate: {
      validateRequest({ toolName, args = {}, allowTools = null, internalObjective = false }) {
        return policy.validate({
          toolName,
          args,
          allowTools,
          withinTask: internalObjective
        });
      }
    },
    recoveryPolicy,
    executeTool,
    executeObjective,
    executeLegacyCommand,
    objectives,
    mcp,
    mcpAdapter: mcp
  };
}

module.exports = {
  createToolRuntime
};
