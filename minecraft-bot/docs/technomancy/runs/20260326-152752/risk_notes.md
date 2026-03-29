# Risk Notes

## Primary Risks
- Chest stock counting can drift if the accepted wood-item set is too broad or too narrow.
- Idle maintenance can become noisy if it retries immediately after failure.
- Maintenance can regress deposit safety if equipment exclusions are bypassed.

## Mitigation Direction
- Count deterministic chest log stacks only.
- Keep maintenance mode disabled by default and apply cooldown after failure.
- Reuse the hardened deposit filter so manual and automated deposit behavior stay aligned.

## Decisions
- The default wood-stock target is `64`.
- Phase 7 counts log stacks in the configured chest for stock maintenance.
- Idle maintenance only runs while the bot is idle.

## Residual Risk
- Real-world chest access/pathing can still fail nondeterministically in Minecraft even when the workflow logic is correct.
