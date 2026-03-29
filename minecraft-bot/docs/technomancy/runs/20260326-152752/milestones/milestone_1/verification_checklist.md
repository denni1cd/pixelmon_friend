# Verification Checklist

- [x] `check wood stock` reports a deterministic chest count/target shape in tests
- [x] `maintain wood <n>` exits early when stock is already sufficient
- [x] `maintain wood <n>` gathers and deposits when stock is low
- [x] enabling/disabling maintenance mode updates shared state
- [x] parser and intent normalization cover the new bounded actions
- [x] full automated suite passes via `node --test`
- [ ] live Prism/LAN check of chest inspection against a real saved chest
- [ ] live idle maintenance mode check while the bot is idle
