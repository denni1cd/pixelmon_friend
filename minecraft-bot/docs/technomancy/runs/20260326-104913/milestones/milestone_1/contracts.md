# Milestone Contracts

## Local Interfaces
- `resource-utils` exposes pure count helpers for crafting output calculations.
- `helpers` exposes craft/place helpers used by both new capabilities and existing storage flows.
- New capabilities call helpers rather than embedding recipe logic inline.

## Assumptions
- Vanilla recipes remain stable for planks, sticks, crafting tables, and chests on the configured Minecraft version.
- Existing placement logic is sufficient for nearby infrastructure placement.

## Unresolved Risks
- Live placement may still fail in cramped terrain even though helper and parser contracts are correct.
