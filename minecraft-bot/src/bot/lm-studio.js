const REQUEST_TIMEOUT_MS = 8000;

function stripCodeFences(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function extractJsonObject(text) {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('LM Studio did not return a JSON object.');
  }

  return cleaned.slice(start, end + 1);
}

async function postChatCompletion(baseUrl, payload) {
  const timeoutSignal = AbortSignal.timeout
    ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: timeoutSignal
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LM Studio error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response.';
}

function createLMStudioClient({ baseUrl, model, logger = null }) {
  return {
    async ask(userMessage, playerName) {
      try {
        return await postChatCompletion(baseUrl, {
          model,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful Minecraft bot. Keep replies brief, natural, and under 25 words.'
            },
            {
              role: 'user',
              content: `${playerName} says: ${userMessage}`
            }
          ]
        });
      } catch (error) {
        logger?.warn?.('lmstudio.ask_failed', {
          playerName,
          message: error.message || String(error)
        });
        throw error;
      }
    },
    async classifyIntent(userMessage, playerName, actionCatalog) {
      const actionList = actionCatalog
        .map((entry) => `${entry.action}${entry.args.length > 0 ? `(${entry.args.join(', ')})` : ''}`)
        .join(', ');

      let content;
      try {
        content = await postChatCompletion(baseUrl, {
          model,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: [
                'Classify Minecraft player chat as one of: task, conversation, unsupported.',
                'Return only JSON.',
                'For task, use this shape: {"kind":"task","action":"...", "args":{...}}.',
                'For conversation, use: {"kind":"conversation"}.',
                'For unsupported requests, use: {"kind":"unsupported","message":"..."}',
                `Allowed task actions: ${actionList}.`,
                'Do not invent actions outside the allowlist.',
                'Only include args that belong to the chosen action.',
                'Use counts only when clearly present; otherwise omit them.'
              ].join(' ')
            },
            {
              role: 'user',
              content: `${playerName} says: ${userMessage}`
            }
          ]
        });
      } catch (error) {
        logger?.warn?.('lmstudio.classify_failed', {
          playerName,
          message: error.message || String(error)
        });
        throw error;
      }

      return JSON.parse(extractJsonObject(content));
    }
  };
}

module.exports = {
  createLMStudioClient
};
