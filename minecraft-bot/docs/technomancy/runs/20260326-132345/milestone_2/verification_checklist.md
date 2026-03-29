# Verification Checklist

- [x] Unsupported or malformed intent payloads are refused safely.
- [x] Exact commands still bypass the LLM path.
- [x] `cancel` routes to stop deterministically.
- [x] conversational status variants route to `status`.
- [x] full local test suite passes.
- [ ] Live LM Studio verification for malformed JSON / timeout refusal behavior.
