function normalizePosition(position) {
  if (!position) {
    return null;
  }

  const floored = position.floored ? position.floored() : position;
  return {
    x: Math.floor(floored.x),
    y: Math.floor(floored.y),
    z: Math.floor(floored.z),
    dimension: position.dimension ?? floored.dimension ?? null
  };
}

function clonePosition(position) {
  return position ? { ...position } : null;
}

function createIdleTaskStatus() {
  return {
    state: 'idle',
    taskName: null,
    startedAt: null,
    details: null,
    persistent: false,
    cancellable: false
  };
}

function cloneTaskStatus(status) {
  return {
    ...createIdleTaskStatus(),
    ...(status || {})
  };
}

function cloneFailure(failure) {
  return failure ? { ...failure } : null;
}

function cloneToolHistoryEntry(entry) {
  if (!entry) {
    return null;
  }

  return {
    ...entry,
    args: entry.args ? { ...entry.args } : null,
    result: entry.result ? { ...entry.result } : null
  };
}

function createRuntimeState() {
  let homePosition = null;
  let chestPosition = null;
  let craftingTablePosition = null;
  let preferredTools = {
    axe: null,
    pickaxe: null
  };
  let taskStatus = createIdleTaskStatus();
  let lastFailure = null;
  let lastOutcome = null;
  let woodMaintenance = {
    enabled: false,
    minimumChestWood: 64,
    lastCheck: null,
    lastStock: null,
    cooldownUntil: null
  };
  let objectiveState = {
    active: false,
    goal: null,
    goalType: null,
    status: 'idle',
    startedAt: null,
    completedAt: null,
    currentStep: 0,
    maxSteps: 0,
    allowedTools: [],
    activeTool: null,
    recentToolHistory: [],
    failureStreak: 0,
    retryCounts: {},
    stuck: {
      detected: false,
      lastRecoveryAt: null
    }
  };

  function cloneObjectiveState() {
    return {
      ...objectiveState,
      allowedTools: [...objectiveState.allowedTools],
      activeTool: objectiveState.activeTool ? { ...objectiveState.activeTool } : null,
      retryCounts: { ...objectiveState.retryCounts },
      stuck: objectiveState.stuck ? { ...objectiveState.stuck } : null,
      recentToolHistory: objectiveState.recentToolHistory
        .map((entry) => cloneToolHistoryEntry(entry))
        .filter(Boolean)
    };
  }

  return {
    getHomePosition() {
      return clonePosition(homePosition);
    },
    setHomePosition(position) {
      homePosition = normalizePosition(position);
      return clonePosition(homePosition);
    },
    getChestPosition() {
      return clonePosition(chestPosition);
    },
    setChestPosition(position) {
      chestPosition = normalizePosition(position);
      return clonePosition(chestPosition);
    },
    getCraftingTablePosition() {
      return clonePosition(craftingTablePosition);
    },
    setCraftingTablePosition(position) {
      craftingTablePosition = normalizePosition(position);
      return clonePosition(craftingTablePosition);
    },
    getPreferredTools() {
      return { ...preferredTools };
    },
    getPreferredTool(role) {
      return preferredTools[role] ?? null;
    },
    setPreferredTool(role, toolName) {
      preferredTools = {
        ...preferredTools,
        [role]: toolName ?? null
      };
      return preferredTools[role];
    },
    getTaskStatus() {
      return cloneTaskStatus(taskStatus);
    },
    setTaskStatus(status) {
      taskStatus = cloneTaskStatus(status);
      return cloneTaskStatus(taskStatus);
    },
    clearTaskStatus() {
      taskStatus = createIdleTaskStatus();
      return cloneTaskStatus(taskStatus);
    },
    getLastFailure() {
      return cloneFailure(lastFailure);
    },
    setLastFailure(failure) {
      lastFailure = cloneFailure(failure);
      return cloneFailure(lastFailure);
    },
    clearLastFailure() {
      lastFailure = null;
      return null;
    },
    getLastOutcome() {
      return lastOutcome ? { ...lastOutcome } : null;
    },
    setLastOutcome(outcome) {
      lastOutcome = outcome ? { ...outcome } : null;
      return lastOutcome ? { ...lastOutcome } : null;
    },
    getWoodMaintenance() {
      return {
        ...woodMaintenance,
        lastStock: woodMaintenance.lastStock ? { ...woodMaintenance.lastStock } : null
      };
    },
    setWoodMaintenance(nextState) {
      woodMaintenance = {
        ...woodMaintenance,
        ...(nextState || {})
      };
      if ('lastStock' in (nextState || {})) {
        woodMaintenance.lastStock = nextState?.lastStock ? { ...nextState.lastStock } : null;
      }

      return {
        ...woodMaintenance,
        lastStock: woodMaintenance.lastStock ? { ...woodMaintenance.lastStock } : null
      };
    },
    getObjectiveState() {
      return cloneObjectiveState();
    },
    beginObjective({ goal, goalType = null, maxSteps, allowedTools = [] }) {
      const existingHistory = objectiveState.recentToolHistory;
      objectiveState = {
        active: true,
        goal,
        goalType,
        status: 'running',
        startedAt: new Date().toISOString(),
        completedAt: null,
        currentStep: 0,
        maxSteps: maxSteps || 0,
        allowedTools: [...allowedTools],
        activeTool: null,
        recentToolHistory: existingHistory,
        failureStreak: 0,
        retryCounts: {},
        stuck: {
          detected: false,
          lastRecoveryAt: null
        }
      };

      return cloneObjectiveState();
    },
    updateObjective(patch) {
      objectiveState = {
        ...objectiveState,
        ...(patch || {}),
        retryCounts: {
          ...objectiveState.retryCounts,
          ...(patch?.retryCounts || {})
        },
        stuck: {
          ...(objectiveState.stuck || {}),
          ...(patch?.stuck || {})
        }
      };

      if (patch?.recentToolHistory) {
        objectiveState.recentToolHistory = patch.recentToolHistory
          .map((entry) => cloneToolHistoryEntry(entry))
          .filter(Boolean);
      }

      return cloneObjectiveState();
    },
    setObjectiveState(patch) {
      return this.updateObjective(patch);
    },
    completeObjective(patch = {}) {
      objectiveState = {
        ...objectiveState,
        ...patch,
        active: false,
        activeTool: null,
        completedAt: patch.completedAt || patch.failedAt || patch.blockedAt || new Date().toISOString()
      };
      return cloneObjectiveState();
    },
    clearObjective() {
      const existingHistory = objectiveState.recentToolHistory;
      objectiveState = {
        active: false,
        goal: null,
        goalType: null,
        status: 'idle',
        startedAt: null,
        completedAt: null,
        currentStep: 0,
        maxSteps: 0,
        allowedTools: [],
        activeTool: null,
        recentToolHistory: existingHistory,
        failureStreak: 0,
        retryCounts: {},
        stuck: {
          detected: false,
          lastRecoveryAt: null
        }
      };

      return cloneObjectiveState();
    },
    clearObjectiveState() {
      return this.clearObjective();
    },
    setActiveTool(activeTool) {
      objectiveState = {
        ...objectiveState,
        activeTool: activeTool ? { ...activeTool } : null
      };
      return objectiveState.activeTool ? { ...objectiveState.activeTool } : null;
    },
    clearActiveTool() {
      objectiveState = {
        ...objectiveState,
        activeTool: null
      };
      return null;
    },
    pushToolHistory(entry, limit = 8) {
      const next = [
        cloneToolHistoryEntry(entry),
        ...objectiveState.recentToolHistory
      ].filter(Boolean).slice(0, limit);
      objectiveState.recentToolHistory = next;
      return cloneObjectiveState();
    },
    getSnapshot() {
      return {
        homePosition: clonePosition(homePosition),
        chestPosition: clonePosition(chestPosition),
        craftingTablePosition: clonePosition(craftingTablePosition),
        preferredTools: { ...preferredTools },
        taskStatus: cloneTaskStatus(taskStatus),
        lastFailure: cloneFailure(lastFailure),
        lastOutcome: lastOutcome ? { ...lastOutcome } : null,
        woodMaintenance: {
          ...woodMaintenance,
          lastStock: woodMaintenance.lastStock ? { ...woodMaintenance.lastStock } : null
        },
        objectiveState: cloneObjectiveState()
      };
    }
  };
}

module.exports = {
  createRuntimeState,
  createIdleTaskStatus,
  normalizePosition
};
