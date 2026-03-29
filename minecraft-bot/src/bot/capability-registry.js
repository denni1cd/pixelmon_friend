class CapabilityRegistry {
  constructor(capabilities = []) {
    this.capabilities = new Map();
    capabilities.forEach((capability) => this.register(capability));
  }

  register(capability) {
    const names = [capability.name, ...(capability.aliases || [])];
    for (const name of names) {
      this.capabilities.set(name, capability);
    }
  }

  resolve(name) {
    return this.capabilities.get(name) || null;
  }

  list() {
    return Array.from(new Set(this.capabilities.values()));
  }
}

module.exports = {
  CapabilityRegistry
};
