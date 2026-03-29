function createMcpAdapter({ registry, executeTool }) {
  function jsonRpcResult(id, result) {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  function jsonRpcError(id, code, message, data = null) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  return {
    listTools() {
      return registry.list().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));
    },
    async callTool(name, args = {}, options = {}) {
      return executeTool({
        toolName: name,
        args,
        source: options.source || 'mcp',
        allowTools: options.allowTools || null,
        withinTask: options.withinTask === true,
        signal: options.signal
      });
    },
    async handleRequest(request) {
      if (!request || typeof request !== 'object') {
        return jsonRpcError(null, -32600, 'Invalid Request');
      }

      switch (request.method) {
        case 'initialize':
          return jsonRpcResult(request.id ?? null, {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'pixelmon-pal-mcp',
              version: '1.0.0'
            },
            capabilities: {
              tools: {}
            }
          });
        case 'tools/list':
          return jsonRpcResult(request.id ?? null, {
            tools: this.listTools()
          });
        case 'tools/call': {
          const result = await this.callTool(
            request.params?.name,
            request.params?.arguments || {},
            { source: 'mcp' }
          );
          return jsonRpcResult(request.id ?? null, {
            content: [
              {
                type: 'text',
                text: result.message
              }
            ],
            structuredContent: result,
            isError: result.ok === false
          });
        }
        default:
          return jsonRpcError(request.id ?? null, -32601, 'Method not found');
      }
    }
  };
}

module.exports = {
  createMcpAdapter
};
