# Milestone Plan

## Objective
- Implement `stash wood` storage behavior without regressing the existing wood command surface.

## Scope
- Add stash command parsing and validation.
- Add chest discovery, crafting-table access, chest crafting, and chest placement helpers.
- Ensure storage provisioning is separated from the requested stash amount.
- Add focused automated tests for pure helper behavior.

## Contract-Sensitive Areas
- `index.js` chat command routing
- `index.js` `activeTask` lifecycle
- `wood-utils.js` command/resource planning helpers

## Verification Plan
- `node --check index.js`
- `node --check wood-utils.js`
- `npm test`
- Record live Minecraft checks as blocked/manual where no honest offline equivalent exists.
