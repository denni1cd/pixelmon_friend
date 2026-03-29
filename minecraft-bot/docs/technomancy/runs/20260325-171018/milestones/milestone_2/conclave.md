# Milestone 2 Conclave

## Tactical Notes
- Reuse the same gather helper pattern for wood and stone where possible.
- Keep `goto` and `status` non-LLM and deterministic.
- Prefer explicit mocked tests over brittle integration simulation.

## Risks
- Stone-capability block matching may be too broad if deepslate or ore blocks are included accidentally.
- `goto` parsing must reject malformed coordinates cleanly.
