# Verification Checklist

- [ ] `stash wood` gathers wood and stores it
- [ ] `stash wood <n>` gathers the requested amount and stores it
- [ ] nearby chest is used when available
- [ ] if no chest exists, a chest is crafted and placed when materials allow
- [ ] if materials do not allow crafting a chest, the bot fails with a clear message
- [ ] existing `wood` and `wood <n>` commands still work in a live session
- [ ] `drop wood` and `pile wood` still work in a live session
- [x] syntax validation passes
- [x] focused automated tests pass
- [x] blocked live-world checks are recorded honestly

## Offline Evidence
- `node --check index.js`
- `node --check wood-utils.js`
- `npm test`

## Live Checks Still Required
- All in-world gather, craft, place, and chest-deposit behaviors
