const { classifyChatMessage } = require('./intent-router');

const OUT_OF_BAND_COMMANDS = new Set([
  'chat',
  'stop',
  'status',
  'inventory',
  'craft_status',
  'where_home',
  'where_chest',
  'enable_wood_maintenance',
  'disable_wood_maintenance'
]);

function canRunWhileBusy(commandName) {
  return OUT_OF_BAND_COMMANDS.has(commandName);
}

async function executeCommand(context, command, meta = {}) {
  if (command.error) {
    if (command.error) {
      context.say(command.error);
    }
    context.logger?.warn?.('command.rejected', {
      commandName: command.name,
      source: meta.source || 'command',
      reason: command.error
    });
    return { ok: false, message: command.error, data: null };
  }

  const capability = context.registry.resolve(command.name);
  if (!capability) {
    const message = 'I do not know that command yet.';
    context.say(message);
    context.logger?.warn?.('command.unknown', {
      commandName: command.name,
      source: meta.source || 'command'
    });
    return { ok: false, message, data: null };
  }

  if (context.tasks?.isBusy?.() && !canRunWhileBusy(command.name)) {
    const active = context.tasks.getStatus?.();
    const activeTaskName = active?.taskName || 'another task';
    const message = `I'm busy with ${activeTaskName}. Say "stop" to cancel it first.`;
    context.say(message);
    context.logger?.warn?.('command.rejected_busy', {
      commandName: command.name,
      source: meta.source || 'command',
      activeTask: activeTaskName
    });
    return { ok: false, message, data: { activeTask: active || null } };
  }

  const migrated = await context.toolRuntime?.executeLegacyCommand?.(
    command.name,
    command.args || {},
    meta
  );
  if (migrated) {
    if (migrated.message) {
      context.say(migrated.message);
    }

    context.logger?.info?.('command.finished', {
      commandName: command.name,
      source: meta.source || 'command',
      ok: migrated?.ok !== false,
      migratedToToolRuntime: true
    });

    return migrated;
  }

  context.logger?.info?.('command.executing', {
    commandName: command.name,
    source: meta.source || 'command',
    args: command.args || {}
  });
  const result = await capability.execute(context, { ...command, ...meta });
  if (result?.message) {
    context.say(result.message);
  }

  context.logger?.info?.('command.finished', {
    commandName: command.name,
    source: meta.source || 'command',
    ok: result?.ok !== false
  });

  return result || { ok: true, message: null, data: null };
}

async function handlePlayerMessage(context, { username, message }) {
  const routed = await classifyChatMessage(context, { username, message });

  if (routed.type === 'refusal') {
    context.say(routed.message);
    return { ok: false, message: routed.message, data: null };
  }

  if (routed.type === 'conversation') {
    try {
      const reply = await context.lmStudio.ask(message, username);
      if (reply) {
        context.say(reply);
      }

      return { ok: true, message: reply, data: null };
    } catch (error) {
      context.logger?.warn?.('chat.conversation_failed', {
        username,
        message: error.message || String(error)
      });
      const failureMessage = "I couldn't chat right now.";
      context.say(failureMessage);
      return { ok: false, message: failureMessage, data: null };
    }
  }

  if (routed.type === 'intent') {
    const busy = context.tasks?.isBusy?.() ?? false;
    if (routed.confirmation && !(busy && !canRunWhileBusy(routed.intent.action))) {
      context.say(routed.confirmation);
    }

    return executeCommand(context, {
      matched: true,
      name: routed.intent.action,
      args: routed.intent.args,
      error: null
    }, {
      username,
      message,
      source: 'intent'
    });
  }

  return executeCommand(context, routed.command, {
    username,
    message,
    source: 'command'
  });
}

module.exports = {
  executeCommand,
  handlePlayerMessage
};
