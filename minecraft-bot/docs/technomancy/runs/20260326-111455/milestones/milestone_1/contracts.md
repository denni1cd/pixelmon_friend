# Milestone Contracts

## Tool Preference
- axes prefer `stone_axe` over `wooden_axe`
- pickaxes prefer `stone_pickaxe` over `wooden_pickaxe`
- capability modules consume the shared helper contract rather than re-implement preference order

## Crafting Surface
- `craft wooden axe`
- `craft wooden pickaxe`
- `craft stone axe`
- `craft stone pickaxe`

Each tool craft capability returns the standard normalized result shape:

```js
{ ok, message, data: { crafted, total } }
```

## Equip Surface
- `equip axe`
- `equip pickaxe`

Equip capabilities delegate to `context.helpers.equipPreferredTool(role, { required: true })` and fail clearly if no supported tool is present.

## Protected Behavior
- no cobble loop logic in this milestone
- no change to existing wood/chest/crafting command semantics beyond additive routes
