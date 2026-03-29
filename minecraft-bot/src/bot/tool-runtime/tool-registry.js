class ToolRegistry {
  constructor(definitions = []) {
    this.tools = new Map();
    definitions.forEach((definition) => this.register(definition));
  }

  register(definition) {
    if (!definition?.name) {
      throw new Error('Tool definition requires a stable name.');
    }

    this.tools.set(definition.name, definition);
  }

  get(name) {
    return this.tools.get(name) || null;
  }

  has(name) {
    return this.tools.has(name);
  }

  list() {
    return Array.from(this.tools.values());
  }

  snapshot() {
    return this.list().map((tool) => JSON.parse(JSON.stringify(tool.snapshot || tool)));
  }
}

module.exports = {
  ToolRegistry
};
