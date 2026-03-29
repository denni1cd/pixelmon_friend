const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const collectBlock = require('mineflayer-collectblock').plugin;

const {
  BOT_CONFIG,
  LM_MODEL,
  LM_STUDIO_BASE,
  WOOD_MAINTENANCE_CHECK_INTERVAL_MS,
  WOOD_MAINTENANCE_FAILURE_COOLDOWN_MS
} = require('./constants');
const { CapabilityRegistry } = require('./capability-registry');
const { handlePlayerMessage } = require('./chat-runtime');
const { createHelpers } = require('./helpers');
const { createLMStudioClient } = require('./lm-studio');
const { createLogger } = require('./logger');
const { configureMovements } = require('./movement-config');
const { createRuntimeState } = require('./state');
const { TaskManager } = require('./task-manager');
const { createToolRuntime } = require('./tool-runtime');
const capabilities = require('./capabilities');

const MAX_CHAT_MESSAGE_LENGTH = 240;

function sanitizeChatMessage(message) {
  if (typeof message !== 'string') {
    return '';
  }

  const normalized = message
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return '';
  }

  if (normalized.length <= MAX_CHAT_MESSAGE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_CHAT_MESSAGE_LENGTH - 3).trimEnd()}...`;
}

function createBotApp(configOverrides = {}) {
  const bot = mineflayer.createBot({
    ...BOT_CONFIG,
    ...configOverrides
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(collectBlock);

  const state = createRuntimeState();
  const logger = createLogger();

  const context = {
    bot,
    mcData: null,
    logger,
    state,
    tasks: new TaskManager({ state, logger }),
    registry: new CapabilityRegistry(capabilities),
    lmStudio: createLMStudioClient({
      baseUrl: LM_STUDIO_BASE,
      model: LM_MODEL,
      logger
    }),
    say(message) {
      const safeMessage = sanitizeChatMessage(message);
      if (safeMessage) {
        bot.chat(safeMessage);
      }
    }
  };

  context.helpers = createHelpers(context);
  context.toolRuntime = createToolRuntime(context);
  context.mcp = context.toolRuntime.mcp;

  const woodMaintenanceTimer = setInterval(async () => {
    const maintenance = context.state.getWoodMaintenance?.();
    if (!maintenance?.enabled || !context.mcData) {
      return;
    }

    if (context.tasks.isBusy()) {
      context.logger.info('wood_maintenance.tick.skipped_busy', {
        activeTask: context.tasks.getStatus?.().taskName || null
      });
      return;
    }

    const cooldownUntil = maintenance.cooldownUntil ? Date.parse(maintenance.cooldownUntil) : null;
    if (cooldownUntil && cooldownUntil > Date.now()) {
      return;
    }

    if (!context.toolRuntime?.objectives?.runObjective) {
      return;
    }

    context.logger.info('wood_maintenance.tick.start', {
      minimumChestWood: maintenance.minimumChestWood
    });

    const result = await context.toolRuntime.objectives.runObjective({
      goalType: 'maintain_wood_stock',
      goal: `maintaining wood stock ${maintenance.minimumChestWood}`,
      constraints: {
        maxSteps: 8,
        allowTools: [
          'inspect_chest_stock',
          'gather_logs',
          'deposit_items',
          'ensure_chest_access'
        ]
      },
      context: {
        targetWoodStock: maintenance.minimumChestWood
      }
    }, {
      source: 'maintenance'
    });

    if (result?.message) {
      context.say(result.message);
    }

    if (result?.ok === false) {
      const nextCooldown = new Date(Date.now() + WOOD_MAINTENANCE_FAILURE_COOLDOWN_MS).toISOString();
      context.state.setWoodMaintenance?.({
        cooldownUntil: nextCooldown
      });
      context.logger.warn('wood_maintenance.tick.failed', {
        message: result.message,
        cooldownUntil: nextCooldown
      });
      return;
    }

    context.state.setWoodMaintenance?.({
      cooldownUntil: null
    });
    context.logger.info('wood_maintenance.tick.completed', {
      message: result?.message || null
    });
  }, WOOD_MAINTENANCE_CHECK_INTERVAL_MS);

  if (typeof woodMaintenanceTimer.unref === 'function') {
    woodMaintenanceTimer.unref();
  }

  bot.once('spawn', () => {
    context.mcData = require('minecraft-data')(bot.version);
    const movements = configureMovements(new Movements(bot, context.mcData), bot.registry);
    bot.pathfinder.setMovements(movements);

    logger.info('bot.spawned', { version: bot.version });
    context.say('Bot online.');
  });

  bot.on('kicked', (reason) => {
    logger.warn('bot.kicked', { reason });
  });

  bot.on('error', (error) => {
    logger.error('bot.error', { message: error.message || String(error) });
  });

  bot.on('chat', async (username, message) => {
    if (username === bot.username) {
      return;
    }

    try {
      logger.info('chat.received', { username, message });
      await handlePlayerMessage(context, { username, message });
    } catch (error) {
      logger.error('chat.unhandled_failure', {
        username,
        message,
        error: error.message || String(error)
      });
      context.say(error.message ? `Task failed: ${error.message}` : 'Something went wrong.');
    }
  });

  bot.on('end', () => {
    clearInterval(woodMaintenanceTimer);
  });

  return { bot, context };
}

module.exports = {
  createBotApp,
  sanitizeChatMessage,
  MAX_CHAT_MESSAGE_LENGTH
};
