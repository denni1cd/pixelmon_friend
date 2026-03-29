function cloneEntry(entry) {
  return entry ? JSON.parse(JSON.stringify(entry)) : null;
}

function createLogger({ historyLimit = 50 } = {}) {
  const history = [];

  function push(level, event, data = {}) {
    const entry = {
      at: new Date().toISOString(),
      level,
      event,
      data
    };

    history.push(entry);
    if (history.length > historyLimit) {
      history.shift();
    }

    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else {
      console.log(line);
    }

    return entry;
  }

  return {
    debug(event, data) {
      return push('debug', event, data);
    },
    info(event, data) {
      return push('info', event, data);
    },
    warn(event, data) {
      return push('warn', event, data);
    },
    error(event, data) {
      return push('error', event, data);
    },
    recentEntries() {
      return history.map(cloneEntry);
    }
  };
}

module.exports = {
  createLogger
};
