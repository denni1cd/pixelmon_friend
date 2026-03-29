# Risk Notes

## Primary Risks
- The model may return unsupported or malformed actions unless the prompt contract is narrow.
- Natural-language routing could accidentally shadow exact commands if execution order is wrong.
- Conversation could leak into task execution unless classification is explicit and conservative.
- LM Studio outages or invalid structured output could destabilize chat handling if fallback paths are weak.

## Mitigation Direction
- Freeze an explicit allowlist and normalized intent schema first.
- Keep exact-command parsing as the first path in the chat router.
- Separate ordinary reply prompting from task-intent prompting.
- Add negative-path tests for invalid payloads and unsupported requests before final integration.
