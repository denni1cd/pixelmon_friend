function normalizeResult(result, fallbackMessage = 'Done.') {
  if (!result) {
    return { ok: true, message: fallbackMessage, data: null };
  }

  return {
    ...result,
    ok: result.ok !== false,
    message: result.message || fallbackMessage,
    data: result.data ?? null
  };
}

function isAbortError(error) {
  return error?.name === 'AbortError'
    || error?.code === 'ABORT_ERR'
    || error?.message === 'Task cancelled.';
}

const CANCEL_CLEANUP_TIMEOUT_MS = 1500;

async function withTimeout(work, timeoutMs, timeoutMessage) {
  return Promise.race([
    Promise.resolve().then(work),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    })
  ]);
}

class TaskManager {
  constructor({ state = null, logger = null } = {}) {
    this.activeTask = null;
    this.state = state;
    this.logger = logger;
  }

  isBusy() {
    return this.activeTask !== null;
  }

  writeTaskStatus(status) {
    if (this.state?.setTaskStatus) {
      this.state.setTaskStatus(status);
    }
  }

  clearTaskStatus() {
    if (this.state?.clearTaskStatus) {
      this.state.clearTaskStatus();
    }
  }

  setLastFailure(failure) {
    if (this.state?.setLastFailure) {
      this.state.setLastFailure(failure);
    }
  }

  clearLastFailure() {
    if (this.state?.clearLastFailure) {
      this.state.clearLastFailure();
    }
  }

  setLastOutcome(outcome) {
    if (this.state?.setLastOutcome) {
      this.state.setLastOutcome(outcome);
    }
  }

  log(level, event, data) {
    if (!this.logger?.[level]) {
      return;
    }

    this.logger[level](event, data);
  }

  getStatus() {
    if (!this.activeTask) {
      return this.state?.getTaskStatus?.() || {
        state: 'idle',
        taskName: null,
        startedAt: null,
        details: null,
        persistent: false,
        cancellable: false
      };
    }

    return {
      state: this.activeTask.state,
      taskName: this.activeTask.name,
      startedAt: this.activeTask.startedAt,
      details: this.activeTask.details || null,
      persistent: this.activeTask.persistent,
      cancellable: this.activeTask.cancellable !== false
    };
  }

  async run(taskName, runner, options = {}) {
    if (this.activeTask) {
      this.log('warn', 'task.rejected_busy', {
        requestedTask: taskName,
        activeTask: this.activeTask.name
      });
      return {
        ok: false,
        message: `I'm busy with ${this.activeTask.name}. Say "stop" to cancel it first.`,
        data: { activeTask: this.getStatus() }
      };
    }

    const task = {
      name: taskName,
      startedAt: new Date().toISOString(),
      details: options.details || null,
      persistent: false,
      cancellable: options.cancellable !== false,
      onCancel: options.onCancel || null,
      controller: new AbortController(),
      state: 'starting'
    };

    this.activeTask = task;
    this.writeTaskStatus({
      state: task.state,
      taskName: task.name,
      startedAt: task.startedAt,
      details: task.details,
      persistent: task.persistent,
      cancellable: task.cancellable
    });
    this.log('info', 'task.started', {
      taskName,
      details: task.details
    });

    try {
      task.state = 'running';
      this.writeTaskStatus({
        state: task.state,
        taskName: task.name,
        startedAt: task.startedAt,
        details: task.details,
        persistent: task.persistent,
        cancellable: task.cancellable
      });

      const result = await runner({
        signal: task.controller.signal,
        task,
        setPersistent: (details = null) => {
          task.persistent = true;
          task.details = details;
          task.state = 'persistent';
          this.writeTaskStatus({
            state: task.state,
            taskName: task.name,
            startedAt: task.startedAt,
            details: task.details,
            persistent: task.persistent,
            cancellable: task.cancellable
          });
          this.log('info', 'task.persisted', {
            taskName: task.name,
            details: task.details
          });
        },
        setDetails: (details = null) => {
          task.details = details;
          this.writeTaskStatus({
            state: task.state,
            taskName: task.name,
            startedAt: task.startedAt,
            details: task.details,
            persistent: task.persistent,
            cancellable: task.cancellable
          });
        }
      });

      if (task.controller.signal.aborted || this.activeTask !== task) {
        this.log('info', 'task.cancelled', {
          taskName: task.name,
          reason: task.controller.signal.reason || 'cancelled'
        });
        this.setLastOutcome({
          state: 'cancelled',
          taskName: task.name,
          at: new Date().toISOString()
        });
        return {
          ok: false,
          message: `Cancelled ${task.name}.`,
          data: null
        };
      }

      const normalized = normalizeResult(result, task.persistent ? `${taskName} active.` : 'Done.');

      if (normalized.ok === false) {
        if (this.activeTask === task) {
          this.activeTask = null;
        }
        this.clearTaskStatus();
        const failure = {
          taskName: task.name,
          message: normalized.message,
          at: new Date().toISOString()
        };
        this.setLastFailure(failure);
        this.setLastOutcome({
          state: 'failed',
          taskName: task.name,
          at: failure.at
        });
        this.log('warn', 'task.failed_result', {
          taskName: task.name,
          message: failure.message
        });
        return {
          ...normalized,
          data: {
            ...(normalized.data || {}),
            failure
          }
        };
      }

      if (task.persistent) {
        this.clearLastFailure();
        this.setLastOutcome({
          state: 'persistent',
          taskName: task.name,
          at: new Date().toISOString()
        });
        this.log('info', 'task.active', {
          taskName: task.name,
          details: task.details
        });
        return normalized;
      }

      this.activeTask = null;
      this.clearTaskStatus();
      this.clearLastFailure();
      this.setLastOutcome({
        state: 'completed',
        taskName: task.name,
        at: new Date().toISOString()
      });
      this.log('info', 'task.completed', {
        taskName: task.name
      });
      return normalized;
    } catch (error) {
      if (task.controller.signal.aborted || isAbortError(error)) {
        if (this.activeTask === task) {
          this.activeTask = null;
        }
        this.clearTaskStatus();
        this.setLastOutcome({
          state: 'cancelled',
          taskName: task.name,
          at: new Date().toISOString()
        });
        this.log('info', 'task.cancelled', {
          taskName: task.name,
          reason: task.controller.signal.reason || error.message || 'cancelled'
        });
        return {
          ok: false,
          message: `Cancelled ${task.name}.`,
          data: null
        };
      }

      if (this.activeTask === task) {
        this.activeTask = null;
      }
      this.clearTaskStatus();

      const failure = {
        taskName: task.name,
        message: error.message || 'Task failed.',
        at: new Date().toISOString()
      };
      this.setLastFailure(failure);
      this.setLastOutcome({
        state: 'failed',
        taskName: task.name,
        at: failure.at
      });
      this.log('error', 'task.failed', {
        taskName: task.name,
        message: failure.message
      });

      return {
        ok: false,
        message: failure.message,
        data: { failure }
      };
    }
  }

  async cancel(reason = 'Stop requested.') {
    const task = this.activeTask;
    if (!task) {
      return { ok: true, message: 'Already idle.', data: null };
    }

    task.state = 'cancelling';
    this.writeTaskStatus({
      state: task.state,
      taskName: task.name,
      startedAt: task.startedAt,
      details: task.details,
      persistent: task.persistent,
      cancellable: task.cancellable
    });
    this.log('info', 'task.cancelling', {
      taskName: task.name,
      reason
    });
    task.controller.abort(reason);

    if (this.activeTask === task) {
      this.activeTask = null;
    }
    this.clearTaskStatus();
    this.setLastOutcome({
      state: 'cancelled',
      taskName: task.name,
      at: new Date().toISOString()
    });

    try {
      if (typeof task.onCancel === 'function') {
        await withTimeout(
          () => task.onCancel(reason, task),
          CANCEL_CLEANUP_TIMEOUT_MS,
          `Cancel cleanup timed out for ${task.name}.`
        );
      }
      this.log('info', 'task.cancelled', {
        taskName: task.name,
        reason
      });
    } catch (error) {
      this.log('warn', 'task.cancel_cleanup_failed', {
        taskName: task.name,
        message: error.message || String(error)
      });
    } finally {
      task.state = 'cancelled';
    }

    return {
      ok: true,
      message: `Stopping ${task.name}.`,
      data: { taskName: task.name }
    };
  }
}

module.exports = {
  TaskManager
};
