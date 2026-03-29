class ToolRegistry {
  constructor(toolDefinitions = []) {
    this.tools = new Map();
    toolDefinitions.forEach((definition) => this.register(definition));
  }

  register(definition) {
    this.tools.set(definition.name, definition);
  }

  resolve(name) {
    return this.tools.get(name) || null;
  }

  list() {
    return Array.from(this.tools.values());
  }

  snapshot() {
    return this.list().map((definition) => ({
      name: definition.name,
      description: definition.description,
      category: definition.category,
      inputSchema: definition.inputSchema,
      outputSchema: definition.outputSchema,
      preconditions: definition.preconditions,
      sideEffects: definition.sideEffects,
      retryPolicy: definition.retryPolicy,
      errorCodes: definition.errorCodes,
      metadata: definition.metadata || {}
    }));
  }
}

module.exports = {
  ToolRegistry
};
